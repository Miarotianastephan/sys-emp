'use strict';

const { Op } = require('sequelize');
const {
  ConfigAbsence,
  EmpAbsence,
  User,
  Notification,
} = require('../../database/models');
const ApiError = require('../../utils/ApiError');
const notificationService = require('../notifications/notification.service');

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function _parseDateOnly(value) {
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    throw ApiError.badRequest('Date invalide');
  }
  return date;
}

function calculerNombreJours(dateDebutAbsence, dateFinAbsence, typeJournee) {
  const debut = _parseDateOnly(dateDebutAbsence);
  const fin = _parseDateOnly(dateFinAbsence);

  if (fin < debut) {
    throw ApiError.badRequest('La date de fin doit être postérieure ou égale à la date de début');
  }

  const jours = Math.floor((fin.getTime() - debut.getTime()) / ONE_DAY_MS) + 1;
  if (jours === 1 && typeJournee !== 'JOURNEE') {
    return 0.5;
  }
  return jours;
}

function getTodayLocalDateOnly() {
  return new Date().toLocaleDateString('en-CA');
}

function estDemandeCongeUrgente(dateDebutAbsence) {
  const today = _parseDateOnly(getTodayLocalDateOnly());
  const debut = _parseDateOnly(dateDebutAbsence);
  const diffDays = Math.floor((debut.getTime() - today.getTime()) / ONE_DAY_MS);
  return diffDays < 7;
}

async function _recupererQuotaOff() {
  const configOff = await ConfigAbsence.findOne({ where: { typeAbsence: 'OFF', estActif: true } });
  if (!configOff) {
    throw ApiError.internal('Configuration OFF introuvable');
  }
  return parseFloat(configOff.joursAutorises);
}

async function _verifierQuotaOff(idUser, dateDebutAbsence, nombreJours) {
  const debut = _parseDateOnly(dateDebutAbsence);
  const mois = debut.getUTCMonth() + 1;
  const annee = debut.getUTCFullYear();

  const moisDebut = new Date(Date.UTC(annee, mois - 1, 1));
  const moisFin = new Date(Date.UTC(annee, mois, 0));

  const demandes = await EmpAbsence.findAll({
    where: {
      idUserDemandeur: idUser,
      dateDebutAbsence: { [Op.between]: [moisDebut.toISOString().slice(0, 10), moisFin.toISOString().slice(0, 10)] },
      statut: { [Op.not]: 'REFUSE' },
    },
    include: [{ model: ConfigAbsence, as: 'configAbsence' }],
  });

  const dejaPris = demandes.reduce((acc, demande) => {
    if (demande.configAbsence?.typeAbsence !== 'OFF') return acc;
    return acc + parseFloat(demande.nombreJours || 0);
  }, 0);

  const quotaOff = await _recupererQuotaOff();
  if (dejaPris + nombreJours > quotaOff) {
    throw ApiError.conflict(
      `Quota OFF dépassé pour le mois ${mois}/${annee} : ${quotaOff} jours maximum`);
  }
}

function _estManagerDe(demandeur, manager) {
  return demandeur.idManager === manager.id || manager.rang.niveau === 1;
}

async function _notifierManager(demande, managerId) {
  if (!managerId) return;

  await notificationService.creerNotification(
    managerId,
    'Nouvelle demande d\'absence',
    `Nouvelle demande de ${demande.configAbsence.typeAbsence} de ${demande.demandeur.nom} ${demande.demandeur.prenom}`,
    { absenceId: demande.id }
  );
}

async function _notifierDemandeur(demande, statut) {
  await notificationService.creerNotification(
    demande.idUserDemandeur,
    `Demande ${statut.toLowerCase()}`,
    `Votre demande d\'absence du ${demande.dateDebutAbsence} au ${demande.dateFinAbsence} a été ${statut.toLowerCase()}.`,
    { absenceId: demande.id }
  );
}

async function recupererConfigurations() {
  const configs = await ConfigAbsence.findAll({ where: { estActif: true } });
  return configs;
}

async function creerDemande(user, payload) {
  const configAbsence = await ConfigAbsence.findOne({
    where: { id: payload.idConfigAbsence, estActif: true },
  });
  if (!configAbsence) {
    throw ApiError.notFound('Type d\'absence introuvable');
  }

  const nombreJours = calculerNombreJours(
    payload.dateDebutAbsence,
    payload.dateFinAbsence,
    payload.typeJournee
  );

  if (payload.dateDebutAbsence < getTodayLocalDateOnly()) {
    throw ApiError.badRequest('La date de début doit être aujourd\'hui ou ultérieure');
  }

  if (configAbsence.typeAbsence === 'OFF') {
    await _verifierQuotaOff(user.id, payload.dateDebutAbsence, nombreJours);
  }

  const nouvelleDemande = await EmpAbsence.create({
    idConfigAbsence: payload.idConfigAbsence,
    idUserDemandeur: user.id,
    dateDemande: new Date(),
    dateDebutAbsence: payload.dateDebutAbsence,
    dateFinAbsence: payload.dateFinAbsence,
    typeJournee: payload.typeJournee,
    priorite: payload.priorite,
    motif: payload.motif || null,
    statut: 'ATTENTE',
    nombreJours,
    commentaireValidateur: null,
  });

  const demande = await EmpAbsence.findOne({
    where: { id: nouvelleDemande.id },
    include: [
      { model: ConfigAbsence, as: 'configAbsence' },
      { model: User, as: 'demandeur', attributes: ['id', 'nom', 'prenom', 'email', 'idManager'] },
    ],
  });

  await _notifierManager(demande, demande.demandeur.idManager);

  return demande;
}

async function recupererMesDemandes(idUser, filter) {
  const where = { idUserDemandeur: idUser };
  if (filter.statut) where.statut = filter.statut;

  return EmpAbsence.findAll({
    where,
    include: [
      { model: ConfigAbsence, as: 'configAbsence' },
    ],
    order: [['dateDemande', 'DESC']],
  });
}

async function recupererDemandesEquipe(manager, filter) {
  const where = {};
  if (filter.statut) where.statut = filter.statut;

  if (manager.rang.niveau !== 1) {
    const users = await User.findAll({
      where: { idManager: manager.id, estActif: true },
      attributes: ['id'],
    });
    const ids = users.map((u) => u.id);
    where.idUserDemandeur = ids.length > 0 ? { [Op.in]: ids } : { [Op.in]: [0] };
  }

  return EmpAbsence.findAll({
    where,
    include: [
      { model: ConfigAbsence, as: 'configAbsence' },
      { model: User, as: 'demandeur', attributes: ['id', 'nom', 'prenom', 'email', 'idManager'] },
    ],
    order: [['dateDemande', 'DESC']],
  });
}

async function validerDemande(manager, id, payload) {
  const demande = await EmpAbsence.findOne({
    where: { id },
    include: [
      { model: ConfigAbsence, as: 'configAbsence' },
      { model: User, as: 'demandeur', attributes: ['id', 'nom', 'prenom', 'email', 'idManager'] },
    ],
  });

  if (!demande) {
    throw ApiError.notFound('Demande d\'absence introuvable');
  }

  if (!manager.rang || manager.rang.niveau !== 1) {
    const demandeur = await User.findOne({ where: { id: demande.idUserDemandeur } });
    if (!demandeur || ! _estManagerDe(demandeur, manager)) {
      throw ApiError.forbidden('Vous ne pouvez pas valider cette demande');
    }
  }

  demande.statut = payload.statut;
  demande.commentaireValidateur = payload.commentaireValidateur || null;
  await demande.save();

  await _notifierDemandeur(demande, demande.statut);

  return demande;
}

module.exports = {
  creerDemande,
  recupererMesDemandes,
  recupererDemandesEquipe,
  recupererConfigurations,
  validerDemande,
};
