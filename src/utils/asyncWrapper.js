'use strict';

/**
 * asyncWrapper — enveloppe un handler async Express.
 * Capture toutes les erreurs et les passe à next() automatiquement.
 *
 * Sans asyncWrapper :
 *   router.get('/', async (req, res, next) => {
 *     try { ... } catch(e) { next(e); }
 *   });
 *
 * Avec asyncWrapper :
 *   router.get('/', asyncWrapper(async (req, res) => { ... }));
 */
const asyncWrapper = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncWrapper;
