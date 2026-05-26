'use strict';

const request = require('supertest');
const { Op }  = require('sequelize');
const { app, state, authHeader, initializeTestSession } = require('./helpers/setup');
const { simulatePresenceMonth, clearPresenceData } = require('./helpers/simulateData');
const { EmpBonusPenalite, EmpTask } = require('../database/models');

const now          = new Date();
const currentYear  = now.getUTCFullYear();
const currentMonth = now.getUTCMonth() + 1;

const today      = () => new Date().toISOString().split('T')[0];
const futureDate = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

let bonusTaskId    = null; // task created in beforeAll for rang3
let manualBonusId  = null; // manual bonus added in entrée manuelle test

beforeAll(async () => {
  await initializeTestSession();

  // 1. Simulate presence: 20 days, 4 late arrivals → triggers RETARD penalty + ASSIDUITE bonus
  await simulatePresenceMonth(state.users.rang3.id, currentYear, currentMonth, {
    joursPresents: 20,
    nombreRetards: 4,
  });

  // 2. Create a task for rang3 in the current month and complete it early
  //    → scorePerformance=100% → triggers TACHE bonus
  const taskRes = await request(app)
    .post('/api/tasks')
    .set(authHeader(1))
    .send({
      idUserAssigne: state.users.rang3.id,
      titre:         'Tâche bonus test',
      dateDebut:     today(),
      dateLimite:    futureDate(10),
      poids:         2,
    });

  if (taskRes.status === 201) {
    bonusTaskId = taskRes.body.data.id;
    // Complete it today (before dateLimite) → facteur = 1.5 → scorePourcentage = 100%
    await request(app)
      .patch(`/api/tasks/${bonusTaskId}/complete`)
      .set(authHeader(3))
      .send({});
  }
});

afterAll(async () => {
  // Clean up presence data
  await clearPresenceData(state.users.rang3.id, currentYear, currentMonth);

  // Clean up bonus records created for rang3 this month
  await EmpBonusPenalite.destroy({
    where: {
      idUser: state.users.rang3.id,
      mois:   currentMonth,
      annee:  currentYear,
    },
  }).catch(() => {});

  // Clean up the task
  if (bonusTaskId) {
    await EmpTask.destroy({ where: { id: bonusTaskId } }).catch(() => {});
  }
});

// ── Calcul mensuel ────────────────────────────────────────────────────────────
describe('Calcul mensuel — POST /api/bonus/calculer/:idUser', () => {
  test('rang1 triggers for rang3 → 200, bonuses and penalties arrays', async () => {
    const res = await request(app)
      .post(`/api/bonus/calculer/${state.users.rang3.id}`)
      .set(authHeader(1))
      .send({ mois: currentMonth, annee: currentYear });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.bonuses)).toBe(true);
    expect(Array.isArray(res.body.data.penalties)).toBe(true);
    expect(typeof res.body.data.total).toBe('number');
  });

  test('idempotent — second call creates 0 new records', async () => {
    const res = await request(app)
      .post(`/api/bonus/calculer/${state.users.rang3.id}`)
      .set(authHeader(1))
      .send({ mois: currentMonth, annee: currentYear });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // All records already exist — no new insertions
    expect(res.body.data.total).toBe(0);
  });

  test('rang3 cannot trigger → 403', async () => {
    const res = await request(app)
      .post(`/api/bonus/calculer/${state.users.rang3.id}`)
      .set(authHeader(3))
      .send({ mois: currentMonth, annee: currentYear });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});

// ── Calcul équipe ─────────────────────────────────────────────────────────────
describe('Calcul équipe — POST /api/bonus/calculer-equipe', () => {
  test('rang1 triggers for entire team → 200, Array result', async () => {
    const res = await request(app)
      .post('/api/bonus/calculer-equipe')
      .set(authHeader(1))
      .send({ mois: currentMonth, annee: currentYear });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('rang3 → 403', async () => {
    const res = await request(app)
      .post('/api/bonus/calculer-equipe')
      .set(authHeader(3))
      .send({ mois: currentMonth, annee: currentYear });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});

// ── Entrée manuelle ───────────────────────────────────────────────────────────
describe('Entrée manuelle — POST /api/bonus/manuel', () => {
  test('rang1 adds BONUS manuel → 201, estManuel=true', async () => {
    const res = await request(app)
      .post('/api/bonus/manuel')
      .set(authHeader(1))
      .send({
        idUser:    state.users.rang3.id,
        type:      'BONUS',
        categorie: 'TACHE',
        libelle:   'Prime exceptionnelle test',
        montant:   75000,
        mois:      currentMonth,
        annee:     currentYear,
        commentaire: 'Bonus test manuel',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.estManuel).toBe(true);
    expect(parseFloat(res.body.data.montant)).toBe(75000);
    manualBonusId = res.body.data.id;
  });

  test('rang1 adds PENALITE manuel → 201, type=PENALITE', async () => {
    const res = await request(app)
      .post('/api/bonus/manuel')
      .set(authHeader(1))
      .send({
        idUser:    state.users.rang3.id,
        type:      'PENALITE',
        categorie: 'RETARD',
        libelle:   'Pénalité test manuelle',
        montant:   2500,
        mois:      currentMonth,
        annee:     currentYear,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.type).toBe('PENALITE');
  });

  test('negative montant → 400', async () => {
    const res = await request(app)
      .post('/api/bonus/manuel')
      .set(authHeader(1))
      .send({
        idUser: state.users.rang3.id, type: 'BONUS', categorie: 'TACHE',
        libelle: 'Montant invalide', montant: -500, mois: currentMonth, annee: currentYear,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('invalid type → 400', async () => {
    const res = await request(app)
      .post('/api/bonus/manuel')
      .set(authHeader(1))
      .send({
        idUser: state.users.rang3.id, type: 'INVALID', categorie: 'TACHE',
        libelle: 'Type invalide', montant: 1000, mois: currentMonth, annee: currentYear,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('rang3 cannot add manual entry → 403', async () => {
    const res = await request(app)
      .post('/api/bonus/manuel')
      .set(authHeader(3))
      .send({
        idUser: state.users.rang3.id, type: 'BONUS', categorie: 'TACHE',
        libelle: 'Auto-bonus', montant: 1000, mois: currentMonth, annee: currentYear,
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});

// ── Mon résumé ────────────────────────────────────────────────────────────────
describe('Mon résumé — GET /api/bonus/mon-resume', () => {
  test('rang3 → 200, summary structure correct', async () => {
    const res = await request(app)
      .get('/api/bonus/mon-resume')
      .set(authHeader(3))
      .query({ mois: currentMonth, annee: currentYear });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const d = res.body.data;
    expect(typeof d.totalBonus).toBe('number');
    expect(typeof d.totalPenalite).toBe('number');
    expect(typeof d.soldeNet).toBe('number');
    expect(d.totalBonus).toBeGreaterThanOrEqual(0);
    expect(d.totalPenalite).toBeGreaterThanOrEqual(0);
    // soldeNet must equal totalBonus - totalPenalite exactly
    expect(Math.round(d.soldeNet * 100)).toBe(
      Math.round((d.totalBonus - d.totalPenalite) * 100)
    );
    expect(Array.isArray(d.detail)).toBe(true);
    // We added manual entries — detail should not be empty
    expect(d.detail.length).toBeGreaterThanOrEqual(1);
  });

  test('no token → 401', async () => {
    const res = await request(app)
      .get('/api/bonus/mon-resume')
      .query({ mois: currentMonth, annee: currentYear });

    expect(res.status).toBe(401);
  });
});

// ── Résumé employé ────────────────────────────────────────────────────────────
describe('Résumé employé — GET /api/bonus/resume/:idUser', () => {
  test('rang1 gets rang3 summary → 200, same structure', async () => {
    const res = await request(app)
      .get(`/api/bonus/resume/${state.users.rang3.id}`)
      .set(authHeader(1))
      .query({ mois: currentMonth, annee: currentYear });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('totalBonus');
    expect(res.body.data).toHaveProperty('totalPenalite');
    expect(res.body.data).toHaveProperty('soldeNet');
    expect(Array.isArray(res.body.data.detail)).toBe(true);
  });

  test('rang3 tries to see another user → 403', async () => {
    const res = await request(app)
      .get(`/api/bonus/resume/${state.users.rang1.id}`)
      .set(authHeader(3))
      .query({ mois: currentMonth, annee: currentYear });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});

// ── Vue équipe ────────────────────────────────────────────────────────────────
describe('Vue équipe — GET /api/bonus/equipe', () => {
  test('rang1 → 200, Array', async () => {
    const res = await request(app)
      .get('/api/bonus/equipe')
      .set(authHeader(1))
      .query({ mois: currentMonth, annee: currentYear });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('rang2 → 200, Array', async () => {
    const res = await request(app)
      .get('/api/bonus/equipe')
      .set(authHeader(2))
      .query({ mois: currentMonth, annee: currentYear });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('rang3 → 403', async () => {
    const res = await request(app)
      .get('/api/bonus/equipe')
      .set(authHeader(3));

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});

// ── Config ────────────────────────────────────────────────────────────────────
describe('Config — GET /api/bonus/config', () => {
  test('rang1 → 200, Array with seeded configs', async () => {
    const res = await request(app)
      .get('/api/bonus/config')
      .set(authHeader(1));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  test('rang2 (has GERER_BONUS_PENALITE) → 200', async () => {
    const res = await request(app)
      .get('/api/bonus/config')
      .set(authHeader(2));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('rang3 → 403 (lacks GERER_BONUS_PENALITE)', async () => {
    const res = await request(app)
      .get('/api/bonus/config')
      .set(authHeader(3));

    expect(res.status).toBe(403);
  });

  test('no token → 401', async () => {
    const res = await request(app).get('/api/bonus/config');
    expect(res.status).toBe(401);
  });
});
