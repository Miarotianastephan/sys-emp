'use strict';

/**
 * flow.test.js — Complete employee lifecycle end-to-end test.
 * Creates a brand-new user and walks through every major feature.
 */

const request = require('supertest');
const { Op }  = require('sequelize');
const { app, state, authHeader, initializeTestSession } = require('./helpers/setup');
const { simulatePresenceMonth, clearPresenceData } = require('./helpers/simulateData');
const { User, EmpPresenceCheckin, EmpAbsence, ConfigFerier, EmpTask, EmpBonusPenalite } = require('../database/models');
const { bornesJourneeLocale } = require('../utils/timezone');

const now          = new Date();
const currentYear  = now.getUTCFullYear();
const currentMonth = now.getUTCMonth() + 1;

const futureDate = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

// ── Flow state — shared across all steps ──────────────────────────────────────
const flow = {
  newUserId:    null,
  newUserEmail: null,
  newToken:     null,
  checkinId:    null,
  absenceId:    null,
  ferierId:     null,
  taskId:       null,
  configCongeId: null,
  rangIds:      {},
};

beforeAll(async () => {
  await initializeTestSession();
  // Resolve rang IDs and absence config IDs for new user registration
  flow.rangIds[1] = state.users.rang1.rang.id;
  flow.rangIds[2] = state.users.rang2.rang.id;
  flow.rangIds[3] = state.users.rang3.rang.id;

  const cfgRes = await request(app)
    .get('/api/absences/config')
    .set(authHeader(1));
  const conge = cfgRes.body.data?.find((c) => c.typeAbsence === 'CONGE');
  flow.configCongeId = conge?.id ?? null;
});

afterAll(async () => {
  if (!flow.newUserId) return;

  // Delete all records for the flow user in reverse dependency order
  await EmpBonusPenalite.destroy({ where: { idUser: flow.newUserId } }).catch(() => {});
  await EmpTask.destroy({ where: { idUserAssigne: flow.newUserId } }).catch(() => {});
  await EmpAbsence.destroy({ where: { idUserDemandeur: flow.newUserId } }).catch(() => {});
  await EmpPresenceCheckin.destroy({ where: { idUser: flow.newUserId } }).catch(() => {});

  if (flow.ferierId) {
    await ConfigFerier.destroy({ where: { id: flow.ferierId } }).catch(() => {});
  }

  await User.destroy({ where: { id: flow.newUserId } }).catch(() => {});
});

// ════════════════════════════════════════════════════════════════════════════════
describe('Complete employee lifecycle', () => {
// ════════════════════════════════════════════════════════════════════════════════

  test('Step 1 — Register new employee', async () => {
    flow.newUserEmail = `flow_${Date.now()}@test.mg`;

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        nom:          'FlowUser',
        prenom:       'Test',
        email:        flow.newUserEmail,
        motDePasse:   'Test1234!',
        dateEmbauche: '2024-01-01',
        idRang:       flow.rangIds[3],
        idManager:    state.users.rang2.id,
        salaire:      800000,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data).not.toHaveProperty('motDePasse');
    flow.newUserId = res.body.data.id;
  });

  test('Step 2 — Login as new employee', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: flow.newUserEmail, motDePasse: 'Test1234!' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    flow.newToken = res.body.data.token;
  });

  test('Step 3 — View own profile', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set({ Authorization: `Bearer ${flow.newToken}` });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.rang.niveau).toBe(3);
    expect(Array.isArray(res.body.data.permissions)).toBe(true);
  });

  test('Step 4 — Pointer entrée', async () => {
    // Delete any existing checkin for the new user today
    const { debut, fin } = bornesJourneeLocale(new Date());
    await EmpPresenceCheckin.destroy({
      where: { idUser: flow.newUserId, debutCheckin: { [Op.between]: [debut, fin] } },
    });

    const res = await request(app)
      .post('/api/presence/entree')
      .set({ Authorization: `Bearer ${flow.newToken}` })
      .send({ methode: 'manuel', sourceDevice: 'flow-test' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.debutCheckin).not.toBeNull();
    flow.checkinId = res.body.data.id;
  });

  test('Step 5 — Statut du jour after entrée', async () => {
    const res = await request(app)
      .get('/api/presence/aujourd-hui')
      .set({ Authorization: `Bearer ${flow.newToken}` });

    expect(res.status).toBe(200);
    expect(res.body.data.aPointe).toBe(true);
    expect(res.body.data.estSorti).toBe(false);
  });

  test('Step 6 — Pointer sortie', async () => {
    const res = await request(app)
      .post('/api/presence/sortie')
      .set({ Authorization: `Bearer ${flow.newToken}` })
      .send({ sourceDevice: 'flow-test' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.finCheckin).not.toBeNull();
    expect(typeof res.body.data.dureeTravail).toBe('number');
  });

  test('Step 7 — Statut du jour after sortie', async () => {
    const res = await request(app)
      .get('/api/presence/aujourd-hui')
      .set({ Authorization: `Bearer ${flow.newToken}` });

    expect(res.status).toBe(200);
    expect(res.body.data.estSorti).toBe(true);
  });

  test('Step 8 — Simulate full month presence', async () => {
    const records = await simulatePresenceMonth(
      flow.newUserId,
      currentYear,
      currentMonth,
      { joursPresents: 20, nombreRetards: 3 }
    );

    // ignoreDuplicates skips today's API-created checkin, so we get at most 20
    expect(records.length).toBeGreaterThanOrEqual(15);

    // Verify the first N retard records
    const retardRecords = records.filter((r) => r.estRetard);
    expect(retardRecords.length).toBe(3);
    retardRecords.forEach((r) => {
      expect(r.minutesRetard).toBe(10);
      expect(r.statut).toBe('retard');
    });

    // Verify non-retard records
    const presentRecords = records.filter((r) => !r.estRetard);
    presentRecords.forEach((r) => {
      expect(r.minutesRetard).toBe(0);
      expect(r.statut).toBe('present');
    });

    // dureeTravail varies slightly (late vs on-time), but must be > 0
    records.forEach((r) => expect(r.dureeTravail).toBeGreaterThan(0));
  });

  test('Step 9 — Submit congé request', async () => {
    if (!flow.configCongeId) return;

    const res = await request(app)
      .post('/api/absences/demande')
      .set({ Authorization: `Bearer ${flow.newToken}` })
      .send({
        idConfigAbsence:  flow.configCongeId,
        dateDebutAbsence: futureDate(15),
        dateFinAbsence:   futureDate(16),
        typeJournee:      'JOURNEE',
        priorite:         'NORMALE',
        motif:            'Congé flow test',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.statut).toBe('ATTENTE');
    flow.absenceId = res.body.data.id;
  });

  test('Step 10 — rang2 views requests including flow user', async () => {
    const res = await request(app)
      .get('/api/absences/equipe')
      .set(authHeader(2));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    if (flow.absenceId) {
      const found = res.body.data.find((a) => a.id === flow.absenceId);
      expect(found).toBeDefined();
    }
  });

  test('Step 11 — rang2 validates flow user congé', async () => {
    if (!flow.absenceId) return;

    const res = await request(app)
      .patch(`/api/absences/${flow.absenceId}/validation`)
      .set(authHeader(2))
      .send({ statut: 'VALIDE' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.statut).toBe('VALIDE');
  });

  test('Step 12 — rang1 creates a jour férié for next month', async () => {
    const nextMonthFirst = (() => {
      const d = new Date();
      d.setMonth(d.getMonth() + 2, 1); // first day of the month after next
      return d.toISOString().split('T')[0];
    })();

    // Remove potential duplicate from previous test runs
    await ConfigFerier.destroy({ where: { dateFerie: nextMonthFirst } }).catch(() => {});

    const res = await request(app)
      .post('/api/feriers')
      .set(authHeader(1))
      .send({ dateFerie: nextMonthFirst, description: 'Jour férié flow test', estRecurrent: false });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    flow.ferierId = res.body.data.id;
  });

  test('Step 13 — rang2 assigns task to flow user', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set(authHeader(2))
      .send({
        idUserAssigne: flow.newUserId,
        titre:         'Tâche flow test',
        dateDebut:     new Date().toISOString().split('T')[0],
        dateLimite:    futureDate(10),
        poids:         3,
        priorite:      'NORMALE',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    flow.taskId = res.body.data.id;
  });

  test('Step 14 — Flow user sees assigned task', async () => {
    const res = await request(app)
      .get('/api/tasks/mes-taches')
      .set({ Authorization: `Bearer ${flow.newToken}` });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    if (flow.taskId) {
      const found = res.body.data.find((t) => t.id === flow.taskId);
      expect(found).toBeDefined();
    }
  });

  test('Step 15 — Flow user completes task', async () => {
    if (!flow.taskId) return;

    const res = await request(app)
      .patch(`/api/tasks/${flow.taskId}/complete`)
      .set({ Authorization: `Bearer ${flow.newToken}` })
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.statut).toBe('TERMINE');
    expect(typeof res.body.data.performanceScore).toBe('number');
    expect(res.body.data.performanceScore).toBeGreaterThan(0);
  });

  test('Step 16 — rang1 triggers bonus calculation for flow user', async () => {
    const res = await request(app)
      .post(`/api/bonus/calculer/${flow.newUserId}`)
      .set(authHeader(1))
      .send({ mois: currentMonth, annee: currentYear });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.total).toBe('number');
  });

  test('Step 17 — Flow user checks own bonus summary', async () => {
    const res = await request(app)
      .get('/api/bonus/mon-resume')
      .set({ Authorization: `Bearer ${flow.newToken}` })
      .query({ mois: currentMonth, annee: currentYear });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.soldeNet).toBe('number');
    expect(Array.isArray(res.body.data.detail)).toBe(true);
  });

  test('Step 18 — rang2 views team bonus including flow user', async () => {
    const res = await request(app)
      .get('/api/bonus/equipe')
      .set(authHeader(2))
      .query({ mois: currentMonth, annee: currentYear, idUser: flow.newUserId });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('Step 19 — rang1 adds manual bonus of 75 000 MGA', async () => {
    const res = await request(app)
      .post('/api/bonus/manuel')
      .set(authHeader(1))
      .send({
        idUser:     flow.newUserId,
        type:       'BONUS',
        categorie:  'ASSIDUITE',
        libelle:    'Prime exceptionnelle flow test',
        montant:    75000,
        mois:       currentMonth,
        annee:      currentYear,
        commentaire: 'Ajout manuel flow test',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.estManuel).toBe(true);
    expect(parseFloat(res.body.data.montant)).toBe(75000);
  });

  test('Step 20 — Final summary: totalBonus ≥ 75 000, soldeNet = totalBonus - totalPenalite', async () => {
    const res = await request(app)
      .get('/api/bonus/mon-resume')
      .set({ Authorization: `Bearer ${flow.newToken}` })
      .query({ mois: currentMonth, annee: currentYear });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const { totalBonus, totalPenalite, soldeNet } = res.body.data;
    expect(totalBonus).toBeGreaterThanOrEqual(75000);

    // soldeNet must equal totalBonus - totalPenalite (rounded to cents)
    expect(Math.round(soldeNet * 100)).toBe(
      Math.round((totalBonus - totalPenalite) * 100)
    );
  });

// ════════════════════════════════════════════════════════════════════════════════
}); // end describe
// ════════════════════════════════════════════════════════════════════════════════
