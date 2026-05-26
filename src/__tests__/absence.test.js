'use strict';

const request = require('supertest');
const { app, state, authHeader, initializeTestSession } = require('./helpers/setup');
const { EmpAbsence } = require('../database/models');

// ── Date helpers ──────────────────────────────────────────────────────────────
const futureDate = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

let configCongeId  = null;
let configOffId    = null;
let absenceCongeId = null; // saved for validate test
let absenceOffId   = null; // saved for refuse test

beforeAll(async () => {
  await initializeTestSession();

  // Resolve config IDs from the /config endpoint
  const res = await request(app)
    .get('/api/absences/config')
    .set(authHeader(3));

  if (res.status !== 200) throw new Error(`Could not load absence configs: ${res.status}`);
  const configs = res.body.data;
  const conge   = configs.find((c) => c.typeAbsence === 'CONGE');
  const off     = configs.find((c) => c.typeAbsence === 'OFF');
  if (!conge || !off) throw new Error('CONGE or OFF config not found in DB — run db:seed');
  configCongeId = conge.id;
  configOffId   = off.id;

  // Clean up any leftover test absences for rang3 from previous runs
  await EmpAbsence.destroy({ where: { idUserDemandeur: state.users.rang3.id } });
});

afterAll(async () => {
  await EmpAbsence.destroy({ where: { idUserDemandeur: state.users.rang3.id } });
});

// ── Soumettre demande ─────────────────────────────────────────────────────────
describe('Soumettre demande — POST /api/absences/demande', () => {
  test('rang3 submits CONGE 15 days in advance → 201', async () => {
    const res = await request(app)
      .post('/api/absences/demande')
      .set(authHeader(3))
      .send({
        idConfigAbsence:  configCongeId,
        dateDebutAbsence: futureDate(15),
        dateFinAbsence:   futureDate(17),
        typeJournee:      'JOURNEE',
        priorite:         'NORMALE',
        motif:            'Congé annuel test',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.statut).toBe('ATTENTE');
    expect(res.body.data.idUserDemandeur).toBe(state.users.rang3.id);
    absenceCongeId = res.body.data.id;
  });

  test('rang3 submits OFF with priorite=HAUTE → 201', async () => {
    const res = await request(app)
      .post('/api/absences/demande')
      .set(authHeader(3))
      .send({
        idConfigAbsence:  configOffId,
        dateDebutAbsence: futureDate(25),
        dateFinAbsence:   futureDate(26),
        typeJournee:      'JOURNEE',
        priorite:         'HAUTE',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.priorite).toBe('HAUTE');
    absenceOffId = res.body.data.id;
  });

  test('dateFinAbsence before dateDebutAbsence → 400', async () => {
    const res = await request(app)
      .post('/api/absences/demande')
      .set(authHeader(3))
      .send({
        idConfigAbsence:  configCongeId,
        dateDebutAbsence: futureDate(30),
        dateFinAbsence:   futureDate(28), // before dateDebut
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('no token → 401', async () => {
    const res = await request(app)
      .post('/api/absences/demande')
      .send({ idConfigAbsence: configCongeId, dateDebutAbsence: futureDate(20), dateFinAbsence: futureDate(22) });

    expect(res.status).toBe(401);
  });
});

// ── Liste ─────────────────────────────────────────────────────────────────────
describe('Liste — GET /api/absences/mes-demandes', () => {
  test('rang3 sees own requests → 200, Array', async () => {
    const res = await request(app)
      .get('/api/absences/mes-demandes')
      .set(authHeader(3));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  test('no token → 401', async () => {
    const res = await request(app).get('/api/absences/mes-demandes');
    expect(res.status).toBe(401);
  });
});

describe('Liste équipe — GET /api/absences/equipe', () => {
  test('rang1 sees team requests → 200, Array', async () => {
    const res = await request(app)
      .get('/api/absences/equipe')
      .set(authHeader(1));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('rang2 sees own team requests → 200, Array', async () => {
    const res = await request(app)
      .get('/api/absences/equipe')
      .set(authHeader(2));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('rang3 → 403', async () => {
    const res = await request(app)
      .get('/api/absences/equipe')
      .set(authHeader(3));

    expect(res.status).toBe(403);
  });
});

// ── Validation / Refus ────────────────────────────────────────────────────────
describe('Validation/Refus — PATCH /api/absences/:id/validation', () => {
  test('rang2 validates rang3 CONGE request → 200, statut=VALIDE', async () => {
    expect(absenceCongeId).not.toBeNull();

    const res = await request(app)
      .patch(`/api/absences/${absenceCongeId}/validation`)
      .set(authHeader(2))
      .send({ statut: 'VALIDE' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.statut).toBe('VALIDE');
  });

  test('rang2 refuses rang3 OFF request with commentaire → 200, statut=REFUSE', async () => {
    expect(absenceOffId).not.toBeNull();

    const res = await request(app)
      .patch(`/api/absences/${absenceOffId}/validation`)
      .set(authHeader(2))
      .send({ statut: 'REFUSE', commentaireValidateur: 'Test refus' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.statut).toBe('REFUSE');
  });

  test('rang3 cannot validate → 403', async () => {
    const res = await request(app)
      .patch(`/api/absences/${absenceCongeId}/validation`)
      .set(authHeader(3))
      .send({ statut: 'VALIDE' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('non-existent id → 404', async () => {
    const res = await request(app)
      .patch('/api/absences/999999/validation')
      .set(authHeader(1))
      .send({ statut: 'VALIDE' });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
