'use strict';

const bonusService             = require('./bonus.service');
const { sendSuccess, sendCreated } = require('../../utils/response');
const asyncWrapper             = require('../../utils/asyncWrapper');
const ApiError                 = require('../../utils/ApiError');
const { User }                 = require('../../database/models');

// POST /api/bonus/calculer/:idUser
const calculer = asyncWrapper(async (req, res) => {
  const idUser = parseInt(req.params.idUser, 10);
  const { mois, annee } = req.body;

  if (req.user.rang.niveau === 2) {
    const target = await User.findOne({ where: { id: idUser }, attributes: ['id', 'idManager'] });
    if (!target) throw ApiError.notFound('Utilisateur introuvable');
    if (target.idManager !== req.user.id) {
      throw ApiError.forbidden('Vous ne pouvez calculer que pour vos subordonnés directs');
    }
  }

  const result = await bonusService.calculateMonthly(idUser, mois, annee, req.user.id);
  return sendSuccess(res, result, `Calcul effectué : ${result.total} enregistrement(s) créé(s)`);
});

// POST /api/bonus/calculer-equipe
const calculerEquipe = asyncWrapper(async (req, res) => {
  const { mois, annee } = req.body;
  const results = await bonusService.calculateTeam(req.user, mois, annee);
  return sendSuccess(res, results, 'Calcul équipe effectué');
});

// POST /api/bonus/manuel
const ajouterManuel = asyncWrapper(async (req, res) => {
  const record = await bonusService.addManual(req.body, req.user);
  return sendCreated(res, record, 'Entrée manuelle créée');
});

// GET /api/bonus/mon-resume
const monResume = asyncWrapper(async (req, res) => {
  const mois  = req.query.mois  ? parseInt(req.query.mois,  10) : (new Date().getUTCMonth() + 1);
  const annee = req.query.annee ? parseInt(req.query.annee, 10) : new Date().getUTCFullYear();
  const summary = await bonusService.getMonthlySummary(req.user.id, mois, annee);
  return sendSuccess(res, summary);
});

// GET /api/bonus/resume/:idUser
const resumeUser = asyncWrapper(async (req, res) => {
  const idUser = parseInt(req.params.idUser, 10);
  const mois   = req.query.mois  ? parseInt(req.query.mois,  10) : (new Date().getUTCMonth() + 1);
  const annee  = req.query.annee ? parseInt(req.query.annee, 10) : new Date().getUTCFullYear();

  if (req.user.rang.niveau === 2) {
    const target = await User.findOne({ where: { id: idUser }, attributes: ['id', 'idManager'] });
    if (!target) throw ApiError.notFound('Utilisateur introuvable');
    if (target.idManager !== req.user.id) throw ApiError.forbidden('Accès refusé');
  }

  const summary = await bonusService.getMonthlySummary(idUser, mois, annee);
  return sendSuccess(res, summary);
});

// GET /api/bonus/equipe
const listeEquipe = asyncWrapper(async (req, res) => {
  const records = await bonusService.listForManager(req.user, req.query);
  return sendSuccess(res, records);
});

// GET /api/bonus/config
const listeConfigs = asyncWrapper(async (req, res) => {
  const configs = await bonusService.listConfigs(req.query);
  return sendSuccess(res, configs);
});

// POST /api/bonus/config
const creerConfig = asyncWrapper(async (req, res) => {
  const config = await bonusService.createConfig(req.body);
  return sendCreated(res, config, 'Configuration créée');
});

// PUT /api/bonus/config/:id
const modifierConfig = asyncWrapper(async (req, res) => {
  const config = await bonusService.updateConfig(parseInt(req.params.id, 10), req.body);
  return sendSuccess(res, config, 'Configuration mise à jour');
});

module.exports = {
  calculer,
  calculerEquipe,
  ajouterManuel,
  monResume,
  resumeUser,
  listeEquipe,
  listeConfigs,
  creerConfig,
  modifierConfig,
};
