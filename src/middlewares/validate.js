'use strict';

const ApiError = require('../utils/ApiError');

/**
 * validate(schema, target) — middleware de validation Joi.
 *
 * Usage :
 *   router.post('/login', validate(loginSchema), authController.login)
 *
 * target : 'body' | 'params' | 'query'  (défaut: 'body')
 */
const validate = (schema, target = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[target], {
    abortEarly:  false,   // remonte TOUTES les erreurs, pas juste la première
    stripUnknown: true,   // supprime les champs non définis dans le schéma
  });

  if (error) {
    const details = error.details.map((d) => d.message);
    throw ApiError.badRequest('Données invalides', details);
  }

  // Ne remplace pas req.query car c'est en lecture seule dans Express
  if (target !== 'query') {
    req[target] = value; // remplace par la valeur nettoyée/castée par Joi
  }
  next();
};

module.exports = validate;
