'use strict';

const { Op } = require('sequelize');
const { EmpTask, ConfigTask, User } = require('../../database/models');
const ApiError  = require('../../utils/ApiError');
const { TIMEZONE } = require('../../utils/timezone');

// ── Date helpers ────────────────────────────────────────────────────────────

function getTodayLocalString() {
  return new Date().toLocaleDateString('en-CA', { timeZone: TIMEZONE });
}

function toDateStr(val) {
  if (!val) return null;
  if (val instanceof Date) return val.toISOString().slice(0, 10);
  return String(val).slice(0, 10);
}

// ── Performance helpers ─────────────────────────────────────────────────────

function calculerFacteurVitesse(dateCompletion, dateLimite) {
  const comp = toDateStr(dateCompletion);
  const lim  = toDateStr(dateLimite);
  if (comp < lim)  return 1.5;
  if (comp === lim) return 1.0;
  return 0.5;
}

function calculerJoursRetard(dateCompletion, dateLimite) {
  const comp = new Date(toDateStr(dateCompletion));
  const lim  = new Date(toDateStr(dateLimite));
  const diffMs = comp - lim;
  return diffMs > 0 ? Math.ceil(diffMs / (1000 * 60 * 60 * 24)) : 0;
}

// ── Access helpers ──────────────────────────────────────────────────────────

async function _getTeamIds(manager) {
  if (manager.rang.niveau === 1) return null; // null = no restriction
  const users = await User.findAll({
    where:      { idManager: manager.id, estActif: true },
    attributes: ['id'],
  });
  return users.map((u) => u.id);
}

async function _assertCanAssign(manager, idUserAssigne) {
  if (manager.rang.niveau === 1) return;
  const assignee = await User.findOne({
    where: { id: idUserAssigne, estActif: true }, attributes: ['id', 'idManager'],
  });
  if (!assignee) throw ApiError.notFound('Utilisateur assigné introuvable');
  if (assignee.idManager !== manager.id) {
    throw ApiError.forbidden('Vous ne pouvez assigner des tâches qu\'aux membres de votre équipe directe');
  }
}

async function _assertCanAccessTask(user, task) {
  if (user.rang.niveau === 1) return;
  if (user.rang.niveau === 3) {
    if (task.idUserAssigne !== user.id) throw ApiError.forbidden('Accès refusé à cette tâche');
    return;
  }
  // rang 2
  const teamIds = await _getTeamIds(user);
  if (!teamIds.includes(task.idUserAssigne)) {
    throw ApiError.forbidden('Accès refusé à cette tâche');
  }
}

// ── Include preset ──────────────────────────────────────────────────────────

const TASK_INCLUDE = [
  { model: User,       as: 'assigne',  attributes: ['id', 'nom', 'prenom', 'email', 'idManager'] },
  { model: User,       as: 'createur', attributes: ['id', 'nom', 'prenom', 'email'] },
  { model: ConfigTask, as: 'config',   attributes: ['id', 'titre'] },
];

// ── Late-status auto-update ─────────────────────────────────────────────────

async function checkAndUpdateLateTasks() {
  const today = getTodayLocalString();
  const [count] = await EmpTask.update(
    { statut: 'EN_RETARD' },
    { where: { statut: 'EN_COURS', dateLimite: { [Op.lt]: today } } }
  );
  if (count > 0) console.log(`⏰ checkAndUpdateLateTasks : ${count} tâche(s) → EN_RETARD`);
  return count;
}

async function checkAndUpdateLateTasksforUser(idUser) {
  const today = getTodayLocalString();
  const [count] = await EmpTask.update(
    { statut: 'EN_RETARD' },
    { where: { idUserAssigne: idUser, statut: 'EN_COURS', dateLimite: { [Op.lt]: today } } }
  );
  return count;
}

// ── Service methods ─────────────────────────────────────────────────────────

async function create(user, payload) {
  // await _assertCanAssign(user, payload.idUserAssigne);

  const task = await EmpTask.create({
    idConfigTask:   payload.idConfigTask   ?? null,
    idUserAssigne:  payload.idUserAssigne,
    idUserCreateur: user.id,
    titre:          payload.titre,
    description:    payload.description   ?? null,
    dateDebut:      toDateStr(payload.dateDebut),
    dateLimite:     toDateStr(payload.dateLimite),
    poids:          payload.poids          ?? 1,
    priorite:       payload.priorite       ?? 'NORMALE',
    commentaire:    payload.commentaire    ?? null,
    statut:         'EN_COURS',
  });

  return EmpTask.findOne({ where: { id: task.id }, include: TASK_INCLUDE });
}

async function update(user, id, payload) {
  const task = await EmpTask.findOne({ where: { id } });
  if (!task) throw ApiError.notFound('Tâche introuvable');

  // if (user.rang.niveau === 2) {
  //   const teamIds = await _getTeamIds(user);
  //   if (!teamIds.includes(task.idUserAssigne)) {
  //     throw ApiError.forbidden('Vous ne pouvez modifier que les tâches de votre équipe');
  //   }
  // }

  // Validate effective date range
  const newDebut  = toDateStr(payload.dateDebut)  || toDateStr(task.dateDebut);
  const newLimite = toDateStr(payload.dateLimite) || toDateStr(task.dateLimite);
  if (newLimite <= newDebut) {
    throw ApiError.badRequest('dateLimite doit être postérieure à dateDebut');
  }

  // Normalize date fields to strings before updating
  const data = { ...payload };
  if (data.dateDebut)  data.dateDebut  = toDateStr(data.dateDebut);
  if (data.dateLimite) data.dateLimite = toDateStr(data.dateLimite);

  await task.update(data);
  return EmpTask.findOne({ where: { id }, include: TASK_INCLUDE });
}

async function complete(user, id, payload) {
  const task = await EmpTask.findOne({ where: { id }, include: TASK_INCLUDE });
  if (!task) throw ApiError.notFound('Tâche introuvable');

  if (task.statut === 'TERMINE') {
    throw ApiError.conflict('Cette tâche est déjà terminée');
  }

  // Access: assigned user, rang-2 direct manager, or rang-1
  const isRang1       = user.rang.niveau === 1;
  const isAssigned    = task.idUserAssigne === user.id;
  const isDirectMgr   = user.rang.niveau === 2 && task.assigne?.idManager === user.id;

  if (!isRang1 && !isAssigned && !isDirectMgr) {
    throw ApiError.forbidden('Vous ne pouvez pas compléter cette tâche');
  }

  const today = getTodayLocalString();
  await task.update({
    statut:         'TERMINE',
    dateCompletion: today,
    commentaire:    payload.commentaire !== undefined ? payload.commentaire : task.commentaire,
  });

  const facteur      = calculerFacteurVitesse(today, task.dateLimite);
  const joursRetard  = calculerJoursRetard(today, task.dateLimite);
  const perfScore    = Math.round(task.poids * facteur * 100) / 100;

  const updated = await EmpTask.findOne({ where: { id }, include: TASK_INCLUDE });
  return {
    ...updated.toJSON(),
    wasOnTime:        joursRetard === 0,
    joursRetard,
    performanceScore: perfScore,
  };
}

async function listForUser(user, filters) {
  await checkAndUpdateLateTasksforUser(user.id);

  const where = { idUserAssigne: user.id };
  _applyFilters(where, filters);

  return EmpTask.findAll({ where, include: TASK_INCLUDE, order: [['dateLimite', 'ASC']] });
}

async function listForManager(user, filters) {
  const teamIds = await _getTeamIds(user);

  // Refresh late statuses for the relevant scope
  const today = getTodayLocalString();
  const lateWhere = { statut: 'EN_COURS', dateLimite: { [Op.lt]: today } };
  if (teamIds !== null) {
    lateWhere.idUserAssigne = { [Op.in]: teamIds.length > 0 ? teamIds : [0] };
  }
  await EmpTask.update({ statut: 'EN_RETARD' }, { where: lateWhere });

  const where = {};
  if (teamIds !== null) {
    where.idUserAssigne = { [Op.in]: teamIds.length > 0 ? teamIds : [0] };
  }
  _applyFilters(where, filters);

  return EmpTask.findAll({ where, include: TASK_INCLUDE, order: [['dateLimite', 'ASC']] });
}

async function getById(user, id) {
  const task = await EmpTask.findOne({ where: { id }, include: TASK_INCLUDE });
  if (!task) throw ApiError.notFound('Tâche introuvable');

  await _assertCanAccessTask(user, task);

  // Refresh late status on the fly for this single task
  if (task.statut === 'EN_COURS' && toDateStr(task.dateLimite) < getTodayLocalString()) {
    await task.update({ statut: 'EN_RETARD' });
    task.statut = 'EN_RETARD';
  }

  return task;
}

async function getPerformanceSummary(manager, idUser, filters) {
  if (manager.rang.niveau !== 1) {
    const target = await User.findOne({ where: { id: idUser }, attributes: ['id', 'idManager'] });
    if (!target) throw ApiError.notFound('Utilisateur introuvable');
    if (target.idManager !== manager.id) {
      throw ApiError.forbidden('Vous ne pouvez consulter que les statistiques de vos subordonnés directs');
    }
  }

  const where = { idUserAssigne: idUser };
  _applyFilters(where, filters);

  const tasks = await EmpTask.findAll({ where });

  const totalTaches      = tasks.length;
  const tachesTerminees  = tasks.filter((t) => t.statut === 'TERMINE').length;
  const tachesEnRetard   = tasks.filter((t) => t.statut === 'EN_RETARD').length;
  const tauxCompletion   = totalTaches > 0
    ? Math.round((tachesTerminees / totalTaches) * 100)
    : 0;

  const scorePerformance = tasks
    .filter((t) => t.statut === 'TERMINE' && t.dateCompletion)
    .reduce((acc, t) => acc + t.poids * calculerFacteurVitesse(t.dateCompletion, t.dateLimite), 0);

  const scoreMaxPossible = tasks.reduce((acc, t) => acc + t.poids * 1.5, 0);
  const scorePourcentage = scoreMaxPossible > 0
    ? Math.round((scorePerformance / scoreMaxPossible) * 100)
    : 0;

  return {
    totalTaches,
    tachesTerminees,
    tachesEnRetard,
    tauxCompletion,
    scorePerformance:  Math.round(scorePerformance  * 100) / 100,
    scoreMaxPossible:  Math.round(scoreMaxPossible  * 100) / 100,
    scorePourcentage,
  };
}

// ── Private filter helper ───────────────────────────────────────────────────

function _applyFilters(where, filters) {
  if (filters.statut)   where.statut   = filters.statut;
  if (filters.priorite) where.priorite = filters.priorite;

  if (filters.mois && filters.annee) {
    const m   = String(filters.mois).padStart(2, '0');
    const dim = new Date(filters.annee, filters.mois, 0).getDate();
    where.dateDebut = { [Op.between]: [`${filters.annee}-${m}-01`, `${filters.annee}-${m}-${dim}`] };
  } else if (filters.annee) {
    where.dateDebut = { [Op.between]: [`${filters.annee}-01-01`, `${filters.annee}-12-31`] };
  }
}

module.exports = {
  create,
  update,
  complete,
  listForUser,
  listForManager,
  getById,
  checkAndUpdateLateTasks,
  checkAndUpdateLateTasksforUser,
  getPerformanceSummary,
};
