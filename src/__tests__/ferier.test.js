'use strict';

const request = require('supertest');
const { app, state, authHeader, initializeTestSession } = require('./helpers/setup');
const { ConfigFerier } = require('../database/models');

// ── Date helper ───────────────────────────────────────────────────────────────
// Use a date far in the future to avoid conflicts with real data
const testDate  = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 5);
  return d.toISOString().split('T')[0];
};
const testDate2 = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 5);
  d.setDate(d.getDate() + 3);
  return d.toISOString().split('T')[0];
};

let ferierId      = null;
let ferierDate    = null;
let ferierDate2   = null;

beforeAll(async () => {
  await initializeTestSession();
  ferierDate  = testDate();
  ferierDate2 = testDate2();
  // Clean up leftovers from previous test runs
  await ConfigFerier.destroy({ where: { dateFerie: [ferierDate, ferierDate2] } }).catch(() => {});
});

afterAll(async () => {
  if (ferierId) {
    await ConfigFerier.destroy({ where: { id: ferierId } }).catch(() => {});
  }
  await ConfigFerier.destroy({ where: { dateFerie: [ferierDate, ferierDate2] } }).catch(() => {});
});

// ── Créer ─────────────────────────────────────────────────────────────────────
describe('Créer — POST /api/feriers', () => {
  test('rang1 creates valid jour férié → 201', async () => {
    const res = await request(app)
      .post('/api/feriers')
      .set(authHeader(1))
      .send({ dateFerie: ferierDate, description: 'Jour de test', estRecurrent: false });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.dateFerie).toContain(ferierDate.slice(0, 10));
    ferierId = res.body.data.id;
    state.ids.ferier = ferierId;
  });

  test('duplicate date → 409', async () => {
    const res = await request(app)
      .post('/api/feriers')
      .set(authHeader(1))
      .send({ dateFerie: ferierDate, description: 'Duplicate' });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  test('missing description → 400', async () => {
    const res = await request(app)
      .post('/api/feriers')
      .set(authHeader(1))
      .send({ dateFerie: ferierDate2 });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('missing dateFerie → 400', async () => {
    const res = await request(app)
      .post('/api/feriers')
      .set(authHeader(1))
      .send({ description: 'No date' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('rang3 cannot create → 403', async () => {
    const res = await request(app)
      .post('/api/feriers')
      .set(authHeader(3))
      .send({ dateFerie: ferierDate2, description: 'Rang3 attempt' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('no token → 401', async () => {
    const res = await request(app)
      .post('/api/feriers')
      .send({ dateFerie: ferierDate2, description: 'No auth' });

    expect(res.status).toBe(401);
  });
});

// ── Liste ─────────────────────────────────────────────────────────────────────
describe('Liste — GET /api/feriers', () => {
  test('authenticated → 200, Array', async () => {
    const res = await request(app)
      .get('/api/feriers')
      .set(authHeader(3));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('filter by annee → 200', async () => {
    const futurYear = new Date().getFullYear() + 5;
    const res = await request(app)
      .get('/api/feriers')
      .set(authHeader(1))
      .query({ annee: futurYear });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    // Should include the one we just created
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  test('no token → 401', async () => {
    const res = await request(app).get('/api/feriers');
    expect(res.status).toBe(401);
  });
});

// ── Détail ────────────────────────────────────────────────────────────────────
describe('Détail — GET /api/feriers/:id', () => {
  test('valid id → 200', async () => {
    const res = await request(app)
      .get(`/api/feriers/${ferierId}`)
      .set(authHeader(3));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(ferierId);
    expect(res.body.data).toHaveProperty('description');
  });

  test('non-existent → 404', async () => {
    const res = await request(app)
      .get('/api/feriers/999999')
      .set(authHeader(1));

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

// ── Modifier ──────────────────────────────────────────────────────────────────
describe('Modifier — PUT /api/feriers/:id', () => {
  test('rang1 updates description only → 200', async () => {
    const res = await request(app)
      .put(`/api/feriers/${ferierId}`)
      .set(authHeader(1))
      .send({ description: 'Description mise à jour' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.description).toBe('Description mise à jour');
  });

  test('rang3 cannot update → 403', async () => {
    const res = await request(app)
      .put(`/api/feriers/${ferierId}`)
      .set(authHeader(3))
      .send({ description: 'Unauthorized update' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('non-existent → 404', async () => {
    const res = await request(app)
      .put('/api/feriers/999999')
      .set(authHeader(1))
      .send({ description: 'Ghost update' });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

// ── Supprimer ─────────────────────────────────────────────────────────────────
describe('Supprimer — DELETE /api/feriers/:id', () => {
  let tempFerierId = null;

  beforeAll(async () => {
    // Create a temporary ferier specifically for the delete tests
    const tempDate = (() => {
      const d = new Date();
      d.setFullYear(d.getFullYear() + 5);
      d.setDate(d.getDate() + 10);
      return d.toISOString().split('T')[0];
    })();
    await ConfigFerier.destroy({ where: { dateFerie: tempDate } }).catch(() => {});
    const r = await request(app)
      .post('/api/feriers')
      .set(authHeader(1))
      .send({ dateFerie: tempDate, description: 'À supprimer' });
    tempFerierId = r.body.data?.id;
  });

  test('rang3 cannot delete → 403', async () => {
    const res = await request(app)
      .delete(`/api/feriers/${tempFerierId}`)
      .set(authHeader(3));

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('rang1 deletes → 200', async () => {
    const res = await request(app)
      .delete(`/api/feriers/${tempFerierId}`)
      .set(authHeader(1));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    tempFerierId = null;
  });

  test('already deleted → 404', async () => {
    const res = await request(app)
      .delete('/api/feriers/999999')
      .set(authHeader(1));

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
