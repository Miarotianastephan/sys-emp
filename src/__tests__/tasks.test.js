'use strict';

const request = require('supertest');
const { app, state, authHeader, initializeTestSession } = require('./helpers/setup');
const { EmpTask } = require('../database/models');

const today      = () => new Date().toISOString().split('T')[0];
const futureDate = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};
const pastDate = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
};

let createdTaskIds = []; // track all tasks for cleanup

beforeAll(async () => {
  await initializeTestSession();
});

afterAll(async () => {
  if (createdTaskIds.length > 0) {
    await EmpTask.destroy({ where: { id: createdTaskIds } }).catch(() => {});
  }
});

// ── Créer ─────────────────────────────────────────────────────────────────────
describe('Créer — POST /api/tasks', () => {
  test('rang1 creates for rang3 with poids=4 → 201', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set(authHeader(1))
      .send({
        idUserAssigne: state.users.rang3.id,
        titre:         'Tâche test poids 4',
        dateDebut:     today(),
        dateLimite:    futureDate(10),
        poids:         4,
        priorite:      'HAUTE',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.poids).toBe(4);
    expect(res.body.data.statut).toBe('EN_COURS');
    state.ids.task = res.body.data.id;
    createdTaskIds.push(res.body.data.id);
  });

  test('rang2 creates for direct subordinate → 201', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set(authHeader(2))
      .send({
        idUserAssigne: state.users.rang3.id,
        titre:         'Tâche par manager',
        dateDebut:     today(),
        dateLimite:    futureDate(7),
        poids:         1,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    createdTaskIds.push(res.body.data.id);
  });

  test('rang2 assigns outside team → 403', async () => {
    // rang1 (admin) is NOT in rang2's direct team
    const res = await request(app)
      .post('/api/tasks')
      .set(authHeader(2))
      .send({
        idUserAssigne: state.users.rang1.id,
        titre:         'Hors équipe',
        dateDebut:     today(),
        dateLimite:    futureDate(5),
        poids:         1,
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('rang3 cannot create → 403', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set(authHeader(3))
      .send({
        idUserAssigne: state.users.rang3.id,
        titre:         'Self-assign',
        dateDebut:     today(),
        dateLimite:    futureDate(5),
        poids:         1,
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('poids=0 → 400', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set(authHeader(1))
      .send({
        idUserAssigne: state.users.rang3.id,
        titre:         'Invalid poids',
        dateDebut:     today(),
        dateLimite:    futureDate(5),
        poids:         0,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('poids=6 → 400', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set(authHeader(1))
      .send({
        idUserAssigne: state.users.rang3.id,
        titre:         'Invalid poids 6',
        dateDebut:     today(),
        dateLimite:    futureDate(5),
        poids:         6,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('dateLimite before dateDebut → 400', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set(authHeader(1))
      .send({
        idUserAssigne: state.users.rang3.id,
        titre:         'Date invalide',
        dateDebut:     futureDate(10),
        dateLimite:    futureDate(5), // before dateDebut
        poids:         1,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('no token → 401', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ idUserAssigne: state.users.rang3.id, titre: 'No auth', dateDebut: today(), dateLimite: futureDate(5) });

    expect(res.status).toBe(401);
  });
});

// ── Mes tâches ────────────────────────────────────────────────────────────────
describe('Mes tâches — GET /api/tasks/mes-taches', () => {
  test('rang3 gets own tasks → 200, Array', async () => {
    const res = await request(app)
      .get('/api/tasks/mes-taches')
      .set(authHeader(3));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  test('filter by statut → 200', async () => {
    const res = await request(app)
      .get('/api/tasks/mes-taches')
      .set(authHeader(3))
      .query({ statut: 'EN_COURS' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('no token → 401', async () => {
    const res = await request(app).get('/api/tasks/mes-taches');
    expect(res.status).toBe(401);
  });
});

// ── Équipe ────────────────────────────────────────────────────────────────────
describe('Équipe — GET /api/tasks/equipe', () => {
  test('rang1 → 200, Array', async () => {
    const res = await request(app)
      .get('/api/tasks/equipe')
      .set(authHeader(1));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('rang2 → 200, Array', async () => {
    const res = await request(app)
      .get('/api/tasks/equipe')
      .set(authHeader(2));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('rang3 → 403', async () => {
    const res = await request(app)
      .get('/api/tasks/equipe')
      .set(authHeader(3));

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});

// ── Détail ────────────────────────────────────────────────────────────────────
describe('Détail — GET /api/tasks/:id', () => {
  test('owner (rang3) → 200, poids and statut present', async () => {
    const res = await request(app)
      .get(`/api/tasks/${state.ids.task}`)
      .set(authHeader(3));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('poids');
    expect(res.body.data).toHaveProperty('statut');
  });

  test('manager (rang1) → 200', async () => {
    const res = await request(app)
      .get(`/api/tasks/${state.ids.task}`)
      .set(authHeader(1));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('non-existent → 404', async () => {
    const res = await request(app)
      .get('/api/tasks/999999')
      .set(authHeader(1));

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

// ── Complétion ────────────────────────────────────────────────────────────────
describe('Complétion — PATCH /api/tasks/:id/complete', () => {
  let wrongTaskId = null; // task assigned to rang2, not rang3

  beforeAll(async () => {
    // Create a task for rang2 so rang3 cannot complete it
    const r = await request(app)
      .post('/api/tasks')
      .set(authHeader(1))
      .send({
        idUserAssigne: state.users.rang2.id,
        titre:         'Tâche pour manager (test wrong user)',
        dateDebut:     today(),
        dateLimite:    futureDate(5),
        poids:         1,
      });
    wrongTaskId = r.body.data?.id;
    if (wrongTaskId) createdTaskIds.push(wrongTaskId);
  });

  test('rang3 completes own task → 200', async () => {
    const res = await request(app)
      .patch(`/api/tasks/${state.ids.task}/complete`)
      .set(authHeader(3))
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.statut).toBe('TERMINE');
    expect(res.body.data.dateCompletion).not.toBeNull();
    expect(typeof res.body.data.performanceScore).toBe('number');
    expect(res.body.data.performanceScore).toBeGreaterThan(0);
    expect(typeof res.body.data.wasOnTime).toBe('boolean');
    expect(res.body.data.joursRetard).toBeGreaterThanOrEqual(0);
  });

  test('double complete → 409', async () => {
    const res = await request(app)
      .patch(`/api/tasks/${state.ids.task}/complete`)
      .set(authHeader(3))
      .send({});

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  test('wrong user (rang3 completes rang2 task) → 403', async () => {
    if (!wrongTaskId) return; // skip if setup failed
    const res = await request(app)
      .patch(`/api/tasks/${wrongTaskId}/complete`)
      .set(authHeader(3))
      .send({});

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('no token → 401', async () => {
    const res = await request(app)
      .patch(`/api/tasks/${state.ids.task}/complete`)
      .send({});

    expect(res.status).toBe(401);
  });
});

// ── Performance summary ───────────────────────────────────────────────────────
describe('Performance summary — GET /api/tasks/stats/:idUser', () => {
  test('rang1 gets rang3 summary → 200, expected fields', async () => {
    const res = await request(app)
      .get(`/api/tasks/stats/${state.users.rang3.id}`)
      .set(authHeader(1));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const d = res.body.data;
    expect(d.totalTaches).toBeGreaterThanOrEqual(1);
    expect(d.scorePerformance).toBeGreaterThanOrEqual(0);
    expect(d.tauxCompletion).toBeGreaterThanOrEqual(0);
    expect(d.tauxCompletion).toBeLessThanOrEqual(100);
    expect(d.scorePourcentage).toBeGreaterThanOrEqual(0);
    expect(d.scorePourcentage).toBeLessThanOrEqual(100);
  });

  test('rang3 views other user stats → 403', async () => {
    const res = await request(app)
      .get(`/api/tasks/stats/${state.users.rang1.id}`)
      .set(authHeader(3));

    // rang3 doesn't have VOIR_EQUIPE_PROPRE → 403
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});

// ── Auto-update late tasks ────────────────────────────────────────────────────
describe('Auto-update late tasks', () => {
  test('task with past dateLimite gets marked EN_RETARD on list query', async () => {
    // Create a task with past dateLimite
    const res = await request(app)
      .post('/api/tasks')
      .set(authHeader(1))
      .send({
        idUserAssigne: state.users.rang3.id,
        titre:         'Tâche expirée test',
        dateDebut:     pastDate(10),
        dateLimite:    pastDate(2), // already past
        poids:         1,
      });
    expect(res.status).toBe(201);
    const lateTaskId = res.body.data.id;
    createdTaskIds.push(lateTaskId);

    // Query mes-taches — service auto-updates late tasks for user
    await request(app)
      .get('/api/tasks/mes-taches')
      .set(authHeader(3));

    // Verify statut in DB
    const task = await EmpTask.findByPk(lateTaskId);
    expect(task.statut).toBe('EN_RETARD');
  });
});
