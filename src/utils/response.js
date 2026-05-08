'use strict';

/**
 * Helpers pour uniformiser toutes les réponses JSON de l'API.
 *
 * Format succès  : { success: true,  data: {...},  message: '...' }
 * Format erreur  : { success: false, error: '...', details: [...] }
 */

const sendSuccess = (res, data = null, message = 'OK', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const sendCreated = (res, data = null, message = 'Créé avec succès') => {
  return sendSuccess(res, data, message, 201);
};

const sendError = (res, message = 'Erreur serveur', statusCode = 500, details = null) => {
  const body = { success: false, error: message };
  if (details) body.details = details;
  return res.status(statusCode).json(body);
};

module.exports = { sendSuccess, sendCreated, sendError };
