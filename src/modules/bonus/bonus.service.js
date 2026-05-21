'use strict';

const { Op } = require('sequelize');
const { ConfigBonusPenalite, EmpBonusPenalite, User } = require('../../database/models');
const presenceService = require('../presence/presence.service');
const taskService     = require('../tasks/task.service');
const ApiError        = require('../../utils/ApiError');

// Bypass access check in taskService.getPerformanceSummary for system-level calls
const SYSTEM_USER = { rang: { niveau: 1 } };

// ── Internal helpers ──────────────────────────────────────────────────────────

async function _computeMontant(config, multiplier, idUser) {
  if (multiplier <= 0) return 0;
  const valeur = parseFloat(config.valeur);
  if (config.estPourcentage) {
    const user    = await User.findOne({ where: { id: idUser }, attributes: ['salaire'] });
    const salaire = parseFloat(user?.salaire || 0);
    return Math.round(multiplier * (valeur / 100) * salaire * 100) / 100;
  }
  return Math.round(multiplier * valeur * 100) / 100;
}

async function _insertIfNotExists(data) {
  const { idUser, idConfig, mois, annee } = data;
  const exists = await EmpBonusPenalite.findOne({ where: { idUser, idConfig, mois, annee } });
  if (exists) return null;
  return EmpBonusPenalite.create(data);
}

// ── Bonus calculation ─────────────────────────────────────────────────────────

async function calculateMonthlyBonuses(idUser, mois, annee, idUserCreateur) {
  const [stats, perf, configs] = await Promise.all([
    presenceService.statsMensuelles(idUser, mois, annee),
    taskService.getPerformanceSummary(SYSTEM_USER, idUser, { mois, annee }),
    ConfigBonusPenalite.findAll({
      where: { type: 'BONUS', estActif: true, categorie: { [Op.in]: ['ASSIDUITE', 'TACHE'] } },
    }),
  ]);

  const created = [];

  for (const config of configs) {
    let multiplier = 0;

    if (config.categorie === 'ASSIDUITE') {
      const taux = stats.tauxAssiduite;
      if (taux >= 100)      multiplier = 1.00;
      else if (taux >= 95)  multiplier = 0.75;
      else if (taux >= 90)  multiplier = 0.50;
    }

    if (config.categorie === 'TACHE') {
      const score = perf.scorePourcentage;
      if (score >= 90)      multiplier = 1.00;
      else if (score >= 70) multiplier = 0.50;
    }

    if (multiplier === 0) continue;

    const montant = await _computeMontant(config, multiplier, idUser);
    if (montant <= 0) continue;

    const record = await _insertIfNotExists({
      idUser,
      idConfig:       config.id,
      type:           'BONUS',
      categorie:      config.categorie,
      libelle:        config.libelle,
      montant,
      mois,
      annee,
      estManuel:      false,
      idUserCreateur,
    });
    if (record) created.push(record);
  }

  return created;
}

// ── Penalty calculation ───────────────────────────────────────────────────────

async function calculateMonthlyPenalties(idUser, mois, annee, idUserCreateur) {
  const [stats, configs] = await Promise.all([
    presenceService.statsMensuelles(idUser, mois, annee),
    ConfigBonusPenalite.findAll({
      where: { type: 'PENALITE', estActif: true, categorie: { [Op.in]: ['RETARD', 'ABSENCE'] } },
    }),
  ]);

  const created = [];

  for (const config of configs) {
    if (!config.seuil) continue;
    const seuil = parseFloat(config.seuil);
    let multiplier = 0;

    if (config.categorie === 'RETARD') {
      if (stats.totalRetards >= seuil) {
        multiplier = Math.floor(stats.totalRetards / seuil);
      }
    }

    if (config.categorie === 'ABSENCE') {
      const joursAbsents = stats.joursOuvrables - stats.totalJoursPresents;
      if (joursAbsents > seuil) {
        multiplier = joursAbsents - seuil;
      }
    }

    if (multiplier <= 0) continue;

    const montant = await _computeMontant(config, multiplier, idUser);
    if (montant <= 0) continue;

    const record = await _insertIfNotExists({
      idUser,
      idConfig:       config.id,
      type:           'PENALITE',
      categorie:      config.categorie,
      libelle:        config.libelle,
      montant,
      mois,
      annee,
      estManuel:      false,
      idUserCreateur,
    });
    if (record) created.push(record);
  }

  return created;
}

// ── Full monthly calculation (bonuses + penalties) ────────────────────────────

async function calculateMonthly(idUser, mois, annee, idUserCreateur) {
  const [bonuses, penalties] = await Promise.all([
    calculateMonthlyBonuses(idUser, mois, annee, idUserCreateur),
    calculateMonthlyPenalties(idUser, mois, annee, idUserCreateur),
  ]);
  return { bonuses, penalties, total: bonuses.length + penalties.length };
}

// ── Team calculation (rang 1 = all, rang 2 = direct subordinates) ─────────────

async function calculateTeam(manager, mois, annee) {
  const whereUser = manager.rang.niveau === 1 ? {} : { idManager: manager.id };
  const users = await User.findAll({
    where:      { ...whereUser, estActif: true },
    attributes: ['id', 'nom', 'prenom'],
  });

  const results = await Promise.allSettled(
    users.map(async (u) => ({
      user:   { id: u.id, nom: u.nom, prenom: u.prenom },
      result: await calculateMonthly(u.id, mois, annee, manager.id),
    }))
  );

  return results.map((r, i) =>
    r.status === 'fulfilled'
      ? r.value
      : { user: { id: users[i].id }, error: r.reason?.message ?? 'Erreur inconnue' }
  );
}

// ── Manual entry ──────────────────────────────────────────────────────────────

async function addManual(payload, requestingUser) {
  const { idUser, type, categorie, libelle, montant, mois, annee, commentaire } = payload;

  if (requestingUser.rang.niveau === 2) {
    const target = await User.findOne({ where: { id: idUser }, attributes: ['id', 'idManager'] });
    if (!target) throw ApiError.notFound('Utilisateur introuvable');
    if (target.idManager !== requestingUser.id) {
      throw ApiError.forbidden('Vous ne pouvez appliquer des bonus/pénalités qu\'aux membres directs de votre équipe');
    }
  }

  return EmpBonusPenalite.create({
    idUser,
    idConfig:       null,
    type,
    categorie,
    libelle,
    montant,
    mois,
    annee,
    estManuel:      true,
    commentaire:    commentaire ?? null,
    idUserCreateur: requestingUser.id,
  });
}

// ── Monthly summary ───────────────────────────────────────────────────────────

async function getMonthlySummary(idUser, mois, annee) {
  const records = await EmpBonusPenalite.findAll({
    where:   { idUser, mois, annee },
    include: [{ model: ConfigBonusPenalite, as: 'config', attributes: ['id', 'libelle', 'categorie'] }],
    order:   [['type', 'ASC'], ['categorie', 'ASC']],
  });

  let totalBonus    = 0;
  let totalPenalite = 0;

  for (const r of records) {
    const m = parseFloat(r.montant);
    if (r.type === 'BONUS')    totalBonus    += m;
    else                       totalPenalite += m;
  }

  return {
    mois,
    annee,
    totalBonus:    Math.round(totalBonus    * 100) / 100,
    totalPenalite: Math.round(totalPenalite * 100) / 100,
    soldeNet:      Math.round((totalBonus - totalPenalite) * 100) / 100,
    detail:        records,
  };
}

// ── List for a single user (own data) ─────────────────────────────────────────

async function listForUser(idUser, filters) {
  const where = { idUser };
  if (filters.type)      where.type      = filters.type;
  if (filters.categorie) where.categorie = filters.categorie;
  if (filters.mois)      where.mois      = parseInt(filters.mois, 10);
  if (filters.annee)     where.annee     = parseInt(filters.annee, 10);

  return EmpBonusPenalite.findAll({
    where,
    include: [{ model: ConfigBonusPenalite, as: 'config', attributes: ['id', 'libelle'] }],
    order:   [['annee', 'DESC'], ['mois', 'DESC'], ['type', 'ASC']],
  });
}

// ── List for manager (team scope) ─────────────────────────────────────────────

async function listForManager(manager, filters) {
  const userWhere = manager.rang.niveau === 1 ? {} : { idManager: manager.id };
  const users = await User.findAll({
    where:      { ...userWhere, estActif: true },
    attributes: ['id'],
  });

  const userIds = users.map((u) => u.id);
  if (userIds.length === 0) return [];

  const where = { idUser: { [Op.in]: userIds } };
  if (filters.type)      where.type      = filters.type;
  if (filters.categorie) where.categorie = filters.categorie;
  if (filters.mois)      where.mois      = parseInt(filters.mois, 10);
  if (filters.annee)     where.annee     = parseInt(filters.annee, 10);
  if (filters.idUser)    where.idUser    = parseInt(filters.idUser, 10);

  return EmpBonusPenalite.findAll({
    where,
    include: [
      { model: User,               as: 'employe', attributes: ['id', 'nom', 'prenom', 'email'] },
      { model: ConfigBonusPenalite, as: 'config', attributes: ['id', 'libelle'] },
    ],
    order: [['annee', 'DESC'], ['mois', 'DESC'], ['idUser', 'ASC']],
  });
}

// ── Config management ─────────────────────────────────────────────────────────

async function listConfigs(filters) {
  const where = {};
  if (filters.estActif  !== undefined) where.estActif  = filters.estActif;
  if (filters.type)                    where.type      = filters.type;
  if (filters.categorie)               where.categorie = filters.categorie;

  return ConfigBonusPenalite.findAll({
    where,
    order: [['type', 'ASC'], ['categorie', 'ASC'], ['libelle', 'ASC']],
  });
}

async function createConfig(payload) {
  return ConfigBonusPenalite.create(payload);
}

async function updateConfig(id, payload) {
  const config = await ConfigBonusPenalite.findOne({ where: { id } });
  if (!config) throw ApiError.notFound('Configuration introuvable');
  await config.update(payload);
  return config;
}

module.exports = {
  calculateMonthlyBonuses,
  calculateMonthlyPenalties,
  calculateMonthly,
  calculateTeam,
  addManual,
  getMonthlySummary,
  listForUser,
  listForManager,
  listConfigs,
  createConfig,
  updateConfig,
};
