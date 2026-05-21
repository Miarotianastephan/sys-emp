'use strict';

const { Router }                  = require('express');
const taskController              = require('./task.controller');
const { authenticate, authorize } = require('../../middlewares/auth');
const validate                    = require('../../middlewares/validate');
const {
  createSchema,
  updateSchema,
  completeSchema,
  listQuerySchema,
  statsQuerySchema,
} = require('./task.validation');

const router = Router();

router.use(authenticate);

// ── Specific paths must be declared before /:id ────────────────────────────

router.get(
  '/mes-taches',
  validate(listQuerySchema, 'query'),
  taskController.mesTaches
);

router.get(
  '/equipe',
  authorize('VOIR_EQUIPE_PROPRE'),
  validate(listQuerySchema, 'query'),
  taskController.equipe
);

router.get(
  '/stats/:idUser',
  authorize('VOIR_EQUIPE_PROPRE'),
  validate(statsQuerySchema, 'query'),
  taskController.stats
);

// ── Generic CRUD ───────────────────────────────────────────────────────────

router.post(
  '/',
  authorize('CREER_TACHE'),
  validate(createSchema),
  taskController.creer
);

router.put(
  '/:id',
  authorize('CREER_TACHE'),
  validate(updateSchema),
  taskController.modifier
);

router.patch(
  '/:id/complete',
  validate(completeSchema),
  taskController.completer
);

router.get('/:id', taskController.detail);

module.exports = router;
