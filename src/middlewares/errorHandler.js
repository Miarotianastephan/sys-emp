'use strict';

const { sendError } = require('../utils/response');
const env           = require('../config/env');

/**
 * Middleware d'erreur global — doit être déclaré EN DERNIER dans app.js.
 * Intercepte toutes les erreurs passées via next(err).
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {

  // Erreur métier connue (ApiError)
  if (err.isApiError) {
    return sendError(res, err.message, err.statusCode, err.details);
  }

  // Erreur de validation Joi — remontée depuis validate.js
  if (err.isJoi) {
    const details = err.details.map((d) => d.message);
    return sendError(res, 'Données invalides', 400, details);
  }

  // Erreur MySQL — doublon sur clé unique (ex: email déjà existant)
  if (err.code === 'ER_DUP_ENTRY') {
    return sendError(res, 'Cette valeur existe déjà (doublon)', 409);
  }

  // Erreur MySQL — FK violée
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return sendError(res, 'Référence invalide (clé étrangère)', 400);
  }

  // Erreur JWT
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 'Token invalide', 401);
  }
  if (err.name === 'TokenExpiredError') {
    return sendError(res, 'Token expiré, veuillez vous reconnecter', 401);
  }

  // Erreur inconnue — on masque le détail en production
  console.error('❌ Erreur non gérée :', err);
  const message = env.isProd ? 'Erreur serveur interne' : err.message;
  return sendError(res, message, 500);
};



module.exports = errorHandler;
