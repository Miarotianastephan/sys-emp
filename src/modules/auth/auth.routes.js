'use strict';

const { Router }                  = require('express');
const authController               = require('./auth.controller');
const { authenticate, authorize }  = require('../../middlewares/auth');
const validate                     = require('../../middlewares/validate');
const { registerSchema, loginSchema } = require('./auth.validation');

const router = Router();

// GET  /api/auth/rangs     — public (référentiel)
router.get('/rangs',   authController.listeRangs);

// GET  /api/auth/postes    — public (référentiel)
router.get('/postes',  authController.listePostes);

// POST /api/auth/register  — public (réservé admin en pratique)
router.post('/register', validate(registerSchema), authController.register);

// POST /api/auth/login     — public
router.post('/login',    validate(loginSchema),    authController.login);

// GET  /api/auth/me        — protégé
router.get('/me', authenticate, authController.getMe);

// GET  /api/auth/mes-subordonnes — protégé, rang 1 et rang 2 seulement
// rang 1 → tous les employés actifs sauf lui-même
// rang 2 → ses subordonnés directs (idManager = soi)
// rang 3 → 403 (pas de VOIR_EQUIPE_PROPRE)
router.get(
  '/mes-subordonnes',
  authenticate,
  authorize('VOIR_EQUIPE_PROPRE'),
  authController.getSubordonnees
);

module.exports = router;