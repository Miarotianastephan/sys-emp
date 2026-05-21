'use strict';

const { Router }                  = require('express');
const bonusController             = require('./bonus.controller');
const { authenticate, authorize } = require('../../middlewares/auth');
const validate                    = require('../../middlewares/validate');
const {
  calculerSchema,
  manuelSchema,
  resumeQuerySchema,
  listeQuerySchema,
  configCreateSchema,
  configUpdateSchema,
} = require('./bonus.validation');

const router = Router();

router.use(authenticate);

// ── Triggers de calcul ────────────────────────────────────────────────────────

// rang 1 or rang 2 (rang 2 access is enforced in the controller)
router.post(
  '/calculer/:idUser',
  authorize('GERER_BONUS_PENALITE'),
  validate(calculerSchema),
  bonusController.calculer
);

// rang 1 only (VOIR_EQUIPE_COMPLETE is exclusive to rang 1)
router.post(
  '/calculer-equipe',
  authorize('VOIR_EQUIPE_COMPLETE'),
  validate(calculerSchema),
  bonusController.calculerEquipe
);

// ── Entrée manuelle ───────────────────────────────────────────────────────────

router.post(
  '/manuel',
  authorize('GERER_BONUS_PENALITE'),
  validate(manuelSchema),
  bonusController.ajouterManuel
);

// ── Consultation ──────────────────────────────────────────────────────────────

// All authenticated users can view their own summary
router.get(
  '/mon-resume',
  validate(resumeQuerySchema, 'query'),
  bonusController.monResume
);

// rang 1 or rang 2 (hierarchy check enforced in controller)
router.get(
  '/resume/:idUser',
  authorize('GERER_BONUS_PENALITE'),
  validate(resumeQuerySchema, 'query'),
  bonusController.resumeUser
);

router.get(
  '/equipe',
  authorize('VOIR_EQUIPE_PROPRE'),
  validate(listeQuerySchema, 'query'),
  bonusController.listeEquipe
);

// ── Configuration ─────────────────────────────────────────────────────────────

// rang 1 and rang 2 can read configs
router.get(
  '/config',
  authorize('GERER_BONUS_PENALITE'),
  validate(listeQuerySchema, 'query'),
  bonusController.listeConfigs
);

// rang 1 only
router.post(
  '/config',
  authorize('VOIR_EQUIPE_COMPLETE'),
  validate(configCreateSchema),
  bonusController.creerConfig
);

router.put(
  '/config/:id',
  authorize('VOIR_EQUIPE_COMPLETE'),
  validate(configUpdateSchema),
  bonusController.modifierConfig
);

module.exports = router;
