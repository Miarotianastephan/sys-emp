'use strict';

const { Router }              = require('express');
const absencesController      = require('./absences.controller');
const { authenticate, authorize } = require('../../middlewares/auth');
const validate                = require('../../middlewares/validate');
const {
  demandeSchema,
  querySchema,
  validationSchema,
} = require('./absences.validation');

const router = Router();

router.use(authenticate);

router.post(
  '/demande',
  authorize('SOUMETTRE_DEMANDE'),
  validate(demandeSchema),
  absencesController.creerDemande
);

router.get(
  '/mes-demandes',
  validate(querySchema, 'query'),
  absencesController.mesDemandes
);

router.get(
  '/equipe',
  authorize('VALIDER_CONGE'),
  validate(querySchema, 'query'),
  absencesController.equipe
);

router.get(
  '/config',
  absencesController.configurations
);

router.patch(
  '/:id/validation',
  authorize('VALIDER_CONGE'),
  validate(validationSchema),
  absencesController.validerDemande
);

module.exports = router;
