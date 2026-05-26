'use strict';

const request    = require('supertest');
const app        = require('../../app');
const { sequelize } = require('../../config/db');
const { ensureTestUsersExist } = require('./seeds');

// ── Shared mutable state across all test files ────────────────────────────────
const state = {
  tokens: { rang1: null, rang2: null, rang3: null },
  users:  { rang1: null, rang2: null, rang3: null },
  ids:    { task: null, absence: null, ferier: null, bonus: null, checkin: null },
};

// ── Auth header helper ────────────────────────────────────────────────────────
function authHeader(rang) {
  const token = state.tokens[`rang${rang}`];
  if (!token) throw new Error(`Token for rang${rang} not initialised — call initializeTestSession() first`);
  return { Authorization: `Bearer ${token}` };
}

// ── Session initialiser — call once in beforeAll ──────────────────────────────
async function initializeTestSession() {
  await ensureTestUsersExist();

  const creds = [
    { rang: 1, email: 'admin@test.mg',   motDePasse: 'Test1234!' },
    { rang: 2, email: 'manager@test.mg', motDePasse: 'Test1234!' },
    { rang: 3, email: 'employe@test.mg', motDePasse: 'Test1234!' },
  ];

  for (const { rang, email, motDePasse } of creds) {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, motDePasse });

    if (res.status !== 200) {
      throw new Error(
        `initializeTestSession: login rang${rang} (${email}) → HTTP ${res.status}\n` +
        JSON.stringify(res.body, null, 2)
      );
    }

    state.tokens[`rang${rang}`] = res.body.data.token;
    state.users[`rang${rang}`]  = res.body.data.user;
  }
}

module.exports = { app, sequelize, state, authHeader, initializeTestSession };
