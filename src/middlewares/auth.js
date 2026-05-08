'use strict';

const jwt          = require('jsonwebtoken');
const ApiError     = require('../utils/ApiError');
const asyncWrapper = require('../utils/asyncWrapper');
const env          = require('../config/env');
const { User, Rang, Permission } = require('../database/models');

// ── authenticate ───────────────────────────────────────────
// Vérifie le JWT dans le header Authorization.
// Injecte req.user = { id, nom, prenom, email, rang, permissions[] }
// ──────────────────────────────────────────────────────────
const authenticate = asyncWrapper(async (req, res, next) => {
  // 1. Récupérer le header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Token manquant ou mal formé');
  }

  // 2. Extraire et vérifier le token
  const token = authHeader.split(' ')[1];
  let decoded;
  try {
    decoded = jwt.verify(token, env.jwt.secret);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Token expiré, veuillez vous reconnecter');
    }
    throw ApiError.unauthorized('Token invalide');
  }

  // 3. Charger l'utilisateur + rang + permissions depuis la BDD
  const user = await User.findOne({
    where:      { id: decoded.id, estActif: true },
    attributes: { exclude: ['motDePasse'] },
    include: [
      {
        model: Rang,
        as:    'rang',
        include: [{ model: Permission, as: 'permissions' }],
      },
    ],
  });

  if (!user) throw ApiError.unauthorized('Utilisateur introuvable ou désactivé');

  // 4. Aplatir les permissions en tableau de codes
  req.user = {
    ...user.toJSON(),
    permissions: user.rang.permissions.map((p) => p.code),
  };

  next();
});

// ── authorize ──────────────────────────────────────────────
// Vérifie que l'utilisateur connecté possède au moins une
// des permissions passées en paramètre.
//
// Usage :
//   router.get('/salaires', authenticate, authorize('VOIR_SALAIRES'), handler)
//   router.post('/taches',  authenticate, authorize('CREER_TACHE', 'VOIR_EQUIPE_COMPLETE'), handler)
// ──────────────────────────────────────────────────────────
const authorize = (...codes) => (req, res, next) => {
  if (!req.user) {
    return next(ApiError.unauthorized('Authentification requise'));
  }

  const hasPermission = codes.some((code) =>
    req.user.permissions.includes(code)
  );

  if (!hasPermission) {
    return next(
      ApiError.forbidden(
        `Accès refusé — permission requise : ${codes.join(' ou ')}`
      )
    );
  }

  next();
};

module.exports = { authenticate, authorize };