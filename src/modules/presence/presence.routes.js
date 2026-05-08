'use strict';

const { Router }           = require('express');
const presenceController   = require('./presence.controller');
const { authenticate, authorize } = require('../../middlewares/auth');
const validate             = require('../../middlewares/validate');
const {
  entreeSchema,
  sortieSchema,
  statsQuerySchema,
} = require('./presence.validation');

const router = Router();

// Toutes les routes de présence nécessitent d'être authentifié
router.use(authenticate);

// ── Pointage ────────────────────────────────────────────────
// Accessible à tous les employés connectés
router.post(
  '/entree',
  authorize('POINTER_PRESENCE'),
  validate(entreeSchema),
  presenceController.entree
);

router.post(
  '/sortie',
  authorize('POINTER_PRESENCE'),
  validate(sortieSchema),
  presenceController.sortie
);

// ── Consultation personnelle ────────────────────────────────
router.get(
  '/aujourd-hui',
  presenceController.aujourdhui
);

router.get(
  '/mes-stats',
  validate(statsQuerySchema, 'query'),
  presenceController.mesStats
);

// ── Vue équipe (managers uniquement) ───────────────────────
router.get(
  '/equipe',
  authorize('VOIR_EQUIPE_PROPRE', 'VOIR_EQUIPE_COMPLETE'),
  validate(statsQuerySchema, 'query'),
  presenceController.equipe
);

module.exports = router;