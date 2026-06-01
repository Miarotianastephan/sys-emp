'use strict';

const { Router }       = require('express');
const authController   = require('./auth.controller');
const { authenticate } = require('../../middlewares/auth');
const validate         = require('../../middlewares/validate');
const { registerSchema, loginSchema, validatePasswordSchema } = require('./auth.validation');

const router = Router();

// POST /api/auth/register  — public (réservé admin en pratique)
router.post('/register', validate(registerSchema), authController.register);

// POST /api/auth/login     — public
router.post('/login',    validate(loginSchema),    authController.login);

// GET  /api/auth/me        — protégé
router.get('/me', authenticate, authController.getMe);

// POST /api/auth/password-validate — protégé (valider le MDP avant une action sensible)
router.post('/password-validate', authenticate, validate(validatePasswordSchema), authController.validatePassword);

module.exports = router;