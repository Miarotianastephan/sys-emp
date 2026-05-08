'use strict';

const presenceService        = require('./presence.service');
const { sendSuccess, sendCreated } = require('../../utils/response');
const asyncWrapper           = require('../../utils/asyncWrapper');

// POST /api/presence/entree
const entree = asyncWrapper(async (req, res) => {
  // Capture automatique de l'IP depuis la requête HTTP
  // x-forwarded-for est utilisé quand l'app passe par un proxy ou un load balancer
  // req.socket.remoteAddress est l'IP directe sinon
  const ipAddress =
    req.headers['x-forwarded-for']?.split(',')[0].trim()
    ?? req.socket.remoteAddress
    ?? null;

  // On fusionne l'IP capturée avec le reste du body envoyé par l'app
  const payload = { ...req.body, ipAddress };
  const checkin = await presenceService.enregistrerEntree(req.user.id, payload);
  return sendCreated(res, checkin, 'Pointage d\'entrée enregistré');
});

// POST /api/presence/sortie
const sortie = asyncWrapper(async (req, res) => {
  const checkin = await presenceService.enregistrerSortie(req.user.id, req.body);
  return sendSuccess(res, checkin, 'Pointage de sortie enregistré');
});

// GET /api/presence/aujourd-hui
const aujourdhui = asyncWrapper(async (req, res) => {
  const statut = await presenceService.statutDuJour(req.user.id);
  return sendSuccess(res, statut);
});

// GET /api/presence/mes-stats?mois=5&annee=2026
const mesStats = asyncWrapper(async (req, res) => {
  const { mois, annee } = req.query;
  const stats = await presenceService.statsMensuelles(
    req.user.id,
    mois  ? parseInt(mois)  : undefined,
    annee ? parseInt(annee) : undefined
  );
  return sendSuccess(res, stats);
});

// GET /api/presence/equipe?mois=5&annee=2026  (manager uniquement)
const equipe = asyncWrapper(async (req, res) => {
  const { mois, annee } = req.query;
  const stats = await presenceService.statsEquipe(
    req.user,
    mois  ? parseInt(mois)  : undefined,
    annee ? parseInt(annee) : undefined
  );
  return sendSuccess(res, stats);
});

module.exports = { entree, sortie, aujourdhui, mesStats, equipe };