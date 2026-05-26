'use strict';

const request = require('supertest');
const { app, state, authHeader, initializeTestSession } = require('./helpers/setup');

// ── Helper ────────────────────────────────────────────────────────────────────
const uniqueEmail = () => `test_${Date.now()}@test.mg`;
const BASE_PAYLOAD = {
  nom:          'Dupont',
  prenom:       'Jean',
  email:        null, // filled per test
  motDePasse:   'Test1234!',
  dateEmbauche: '2024-06-01',
  idRang:       3, // rang niveau 3 — resolved dynamically below if needed
};

let rangIds = {}; // { 1: id, 2: id, 3: id }
let createdUserId = null;

beforeAll(async () => {
  await initializeTestSession();
  // Resolve real rang IDs from logged-in user state
  // rang1 user has rang.id for niveau 1, etc.
  rangIds[1] = state.users.rang1.rang.id;
  rangIds[2] = state.users.rang2.rang.id;
  rangIds[3] = state.users.rang3.rang.id;
});

afterAll(async () => {
  // Delete any users created during register tests
  const { User } = require('../database/models');
  if (createdUserId) {
    await User.destroy({ where: { id: createdUserId } }).catch(() => {});
  }
  // Clean up any extra test-registration emails
  await User.destroy({ where: { email: { [require('sequelize').Op.like]: 'test_%@test.mg' } } }).catch(() => {});
});

// ── Registration ──────────────────────────────────────────────────────────────
describe('Registration — POST /api/auth/register', () => {
  test('valid payload → 201, user returned without motDePasse', async () => {
    const email = uniqueEmail();
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...BASE_PAYLOAD, email, idRang: rangIds[3] });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data).toHaveProperty('email', email);
    expect(res.body.data).not.toHaveProperty('motDePasse');
    createdUserId = res.body.data.id;
  });

  test('duplicate email → 409', async () => {
    const email = uniqueEmail();
    await request(app)
      .post('/api/auth/register')
      .send({ ...BASE_PAYLOAD, email, idRang: rangIds[3] });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...BASE_PAYLOAD, email, idRang: rangIds[3] });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  test('missing email → 400, details array present', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ nom: 'A', prenom: 'B', motDePasse: 'Test1234!', dateEmbauche: '2024-01-01', idRang: rangIds[3] });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(Array.isArray(res.body.details)).toBe(true);
  });

  test('missing motDePasse → 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ nom: 'A', prenom: 'B', email: uniqueEmail(), dateEmbauche: '2024-01-01', idRang: rangIds[3] });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('missing dateEmbauche → 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ nom: 'A', prenom: 'B', email: uniqueEmail(), motDePasse: 'Test1234!', idRang: rangIds[3] });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('invalid email format → 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...BASE_PAYLOAD, email: 'not-an-email', idRang: rangIds[3] });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('motDePasse below minimum length → 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...BASE_PAYLOAD, email: uniqueEmail(), motDePasse: 'Short1', idRang: rangIds[3] });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('invalid idRang → 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...BASE_PAYLOAD, email: uniqueEmail(), idRang: 9999 });

    // auth.service checks rang existence → returns 400 (ApiError.badRequest)
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// ── Login ─────────────────────────────────────────────────────────────────────
describe('Login — POST /api/auth/login', () => {
  test('correct credentials → 200, token and user present', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.mg', motDePasse: 'Test1234!' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data).toHaveProperty('user');
    expect(res.body.data.user).toHaveProperty('rang');
    expect(Array.isArray(res.body.data.user.permissions)).toBe(true);
    expect(typeof res.body.data.token).toBe('string');
    expect(res.body.data.token.length).toBeGreaterThan(10);
  });

  test('wrong password → 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.mg', motDePasse: 'WrongPass!' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('non-existent email → 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@nowhere.mg', motDePasse: 'Test1234!' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('missing email → 400', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ motDePasse: 'Test1234!' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('missing password → 400', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.mg' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// ── Get profile ───────────────────────────────────────────────────────────────
describe('Get Profile — GET /api/auth/me', () => {
  test('valid token → 200, rang and permissions array present', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set(authHeader(1));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('rang');
    expect(res.body.data.rang).toHaveProperty('niveau', 1);
    expect(Array.isArray(res.body.data.permissions)).toBe(true);
    expect(res.body.data.permissions.length).toBeGreaterThan(0);
    expect(res.body.data).not.toHaveProperty('motDePasse');
  });

  test('no token → 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('malformed token → 401', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set({ Authorization: 'Bearer this.is.garbage' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
