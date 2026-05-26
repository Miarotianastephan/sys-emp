'use strict';

const request = require('supertest');
const { Op }  = require('sequelize');
const { app, state, authHeader, initializeTestSession } = require('./helpers/setup');
const { simulatePresenceMonth, clearPresenceData } = require('./helpers/simulateData');
const { EmpPresenceCheckin } = require('../database/models');
const { bornesJourneeLocale } = require('../utils/timezone');

const now         = new Date();
const currentYear = now.getUTCFullYear();
const currentMonth = now.getUTCMonth() + 1;

beforeAll(async () => {
  await initializeTestSession();

  // Delete any existing checkin for rang3 today so tests start clean
  const { debut, fin } = bornesJourneeLocale(new Date());
  await EmpPresenceCheckin.destroy({
    where: {
      idUser:      state.users.rang3.id,
      debutCheckin: { [Op.between]: [debut, fin] },
    },
  });
});

// ── Pointer entrée ────────────────────────────────────────────────────────────
describe('Pointer entrée — POST /api/presence/entree', () => {
  test('valid entree → 201', async () => {
    const res = await request(app)
      .post('/api/presence/entree')
      .set(authHeader(3))
      .send({ methode: 'manuel', sourceDevice: 'test-suite' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('debutCheckin');
    expect(res.body.data.debutCheckin).not.toBeNull();
    expect(res.body.data.niveauConfiance).toBeGreaterThanOrEqual(0);
    expect(res.body.data.niveauConfiance).toBeLessThanOrEqual(3);
    expect(['present', 'retard']).toContain(res.body.data.statut);
    expect(typeof res.body.data.estValide).toBe('boolean');

    // Save for subsequent tests
    state.ids.checkin = res.body.data.id;
  });

  test('double entree same day → 409', async () => {
    const res = await request(app)
      .post('/api/presence/entree')
      .set(authHeader(3))
      .send({ methode: 'manuel' });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  test('no token → 401', async () => {
    const res = await request(app)
      .post('/api/presence/entree')
      .send({ methode: 'manuel' });

    expect(res.status).toBe(401);
  });
});

// ── Pointer sortie ────────────────────────────────────────────────────────────
describe('Pointer sortie — POST /api/presence/sortie', () => {
  test('valid sortie → 200', async () => {
    const res = await request(app)
      .post('/api/presence/sortie')
      .set(authHeader(3))
      .send({ sourceDevice: 'test-suite' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('finCheckin');
    expect(res.body.data.finCheckin).not.toBeNull();
    expect(typeof res.body.data.dureeTravail).toBe('number');
  });

  test('sortie without open entree → 404', async () => {
    // The checkin is now closed (finCheckin set) — no open checkin exists
    const res = await request(app)
      .post('/api/presence/sortie')
      .set(authHeader(3))
      .send({});

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  test('no token → 401', async () => {
    const res = await request(app).post('/api/presence/sortie').send({});
    expect(res.status).toBe(401);
  });
});

// ── Statut du jour ────────────────────────────────────────────────────────────
describe('Statut du jour — GET /api/presence/aujourd-hui', () => {
  test('after entree and sortie → 200, aPointe=true, estSorti=true', async () => {
    const res = await request(app)
      .get('/api/presence/aujourd-hui')
      .set(authHeader(3));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.aPointe).toBe(true);
    expect(res.body.data.estSorti).toBe(true);
    expect(res.body.data.checkin).not.toBeNull();
  });

  test('no token → 401', async () => {
    const res = await request(app).get('/api/presence/aujourd-hui');
    expect(res.status).toBe(401);
  });
});

// ── Statistiques mensuelles ───────────────────────────────────────────────────
describe('Statistiques mensuelles — GET /api/presence/mes-stats', () => {
  beforeAll(async () => {
    // Simulate a full month of presence for rang3 (20 days, 4 late)
    // ignoreDuplicates handles today's record already created by the API test above
    await simulatePresenceMonth(state.users.rang3.id, currentYear, currentMonth, {
      joursPresents:  20,
      nombreRetards:  4,
    });
  });

  afterAll(async () => {
    await clearPresenceData(state.users.rang3.id, currentYear, currentMonth);
  });

  test('own stats → 200, expected fields present', async () => {
    const res = await request(app)
      .get('/api/presence/mes-stats')
      .set(authHeader(3));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const d = res.body.data;
    expect(d.totalJoursPresents).toBeGreaterThanOrEqual(1);
    expect(d.totalRetards).toBeGreaterThanOrEqual(0);
    expect(d.tauxAssiduite).toBeGreaterThanOrEqual(0);
    expect(d.tauxAssiduite).toBeLessThanOrEqual(100);
    expect(Array.isArray(d.historique)).toBe(true);
    expect(d.pointagesSuspects).toBeGreaterThanOrEqual(0);
  });

  test('with mois and annee params → 200', async () => {
    const res = await request(app)
      .get('/api/presence/mes-stats')
      .set(authHeader(3))
      .query({ mois: currentMonth, annee: currentYear });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalJoursPresents).toBeGreaterThanOrEqual(1);
  });

  test('no token → 401', async () => {
    const res = await request(app).get('/api/presence/mes-stats');
    expect(res.status).toBe(401);
  });
});

// ── Vue équipe ────────────────────────────────────────────────────────────────
describe('Vue équipe — GET /api/presence/equipe', () => {
  test('rang1 → 200, data is Array', async () => {
    const res = await request(app)
      .get('/api/presence/equipe')
      .set(authHeader(1))
      .query({ mois: currentMonth, annee: currentYear });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('rang2 → 200, data is Array', async () => {
    const res = await request(app)
      .get('/api/presence/equipe')
      .set(authHeader(2))
      .query({ mois: currentMonth, annee: currentYear });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('rang3 → 403', async () => {
    const res = await request(app)
      .get('/api/presence/equipe')
      .set(authHeader(3));

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('no token → 401', async () => {
    const res = await request(app).get('/api/presence/equipe');
    expect(res.status).toBe(401);
  });
});
