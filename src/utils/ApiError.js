'use strict';

/**
 * ApiError — erreur métier avec un statusCode HTTP.
 *
 * Usage :
 *   throw new ApiError(404, 'Utilisateur introuvable');
 *   throw new ApiError(403, 'Accès refusé');
 */
class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details    = details;   // utile pour les erreurs de validation (tableau)
    this.isApiError = true;      // flag pour le errorHandler
    Error.captureStackTrace(this, this.constructor);
  }

  // Raccourcis pratiques
  static badRequest(msg, details)  { return new ApiError(400, msg, details); }
  static unauthorized(msg = 'Non authentifié')       { return new ApiError(401, msg); }
  static forbidden(msg = 'Accès refusé')             { return new ApiError(403, msg); }
  static notFound(msg = 'Ressource introuvable')     { return new ApiError(404, msg); }
  static conflict(msg)             { return new ApiError(409, msg); }
  static internal(msg = 'Erreur serveur interne')    { return new ApiError(500, msg); }
}

module.exports = ApiError;
