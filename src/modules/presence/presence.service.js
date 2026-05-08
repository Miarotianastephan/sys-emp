'use strict';

const { Op, UniqueConstraintError } = require('sequelize');
const { sequelize }                = require('../../config/db');
const EmpPresenceCheckin          = require('../../database/models/empPresenceCheckin.model');
const User                        = require('../../database/models/user.model');
const ApiError                    = require('../../utils/ApiError');
const { niveauConfiance }         = require('../../utils/network'); 
const {
  bornesJourneeLocale,
  heureDebutTravailUTC,
} = require('../../utils/timezone'); 

// ── Config horaire ──────────────────────────────────────────────────────
const RETARD_MAX_MINUTES  = 10;

// ── Helpers ─────────────────────────────────────────────────────────────
/**
 * Calcule le retard en UTC mais par rapport à l'heure locale Madagascar.
 *
 * Exemple :
 *   08:00 Madagascar = 05:00 UTC → heure théorique en UTC
 *   08:10 Madagascar = 05:10 UTC → limite tolérance en UTC
 *   Si l'employé arrive à 05h35 UTC (08h35 Madagascar) → 35 min de retard
 */
async function calculerRetard(heureEntreeUTC) {
  const heureTheoriqueUTC  = await heureDebutTravailUTC(heureEntreeUTC);
  const limiteToleranceUTC = new Date(
    heureTheoriqueUTC.getTime() + RETARD_MAX_MINUTES * 60 * 1000
  );

  console.log('hEntrerUTC', heureEntreeUTC, 
    '<= limiteToleranceUTC', limiteToleranceUTC, 
    '?heureTheoriqueUTC', heureTheoriqueUTC
  );
  if (heureEntreeUTC <= limiteToleranceUTC) {
    return { estRetard: false, minutes: 0 };
  }

  const diffMs = heureEntreeUTC - heureTheoriqueUTC;
  return { estRetard: true, minutes: Math.floor(diffMs / 60000) };
}

function calculerDureeTravail(debut, fin) {
  return Math.floor((fin - debut) / 60000);
}

// ── Service ─────────────────────────────────────────────────────────────

async function enregistrerEntree(idUser, payload) {
  const maintenant     = new Date();
  const { debut, fin } = bornesJourneeLocale(maintenant);

  const existant = await EmpPresenceCheckin.findOne({
    where: {
      idUser,
      debutCheckin: { [Op.between]: [debut, fin] },
    },
  });

  if (existant) {
    if (!existant.finCheckin) {
      throw ApiError.conflict(
        'Un pointage est déjà ouvert aujourd\'hui. Pointez la sortie d\'abord.'
      );
    }
    throw ApiError.conflict(
      'Vous avez déjà pointé entrée et sortie aujourd\'hui.'
    );
  }

  // Calcul retard basé sur l'heure locale Madagascar
  const { estRetard, minutes: minutesRetard } = await calculerRetard(maintenant);

  const confiance  = niveauConfiance({
    ipAddress:  payload.ipAddress,
    ssidReseau: payload.ssidReseau,
    methode:    payload.methode ?? 'manuel',
  });
  const estValide = confiance > 0;

  const checkin = await EmpPresenceCheckin.create({
    idUser,
    debutCheckin:  maintenant,       // stocké en UTC en BDD — c'est correct
    methode:       payload.methode      ?? 'manuel',
    ipAddress:     payload.ipAddress    ?? null,
    ssidReseau:    payload.ssidReseau   ?? null,
    sourceDevice:  payload.sourceDevice ?? null,
    latitude:      payload.latitude     ?? null,
    longitude:     payload.longitude    ?? null,
    estRetard,
    minutesRetard,
    statut:        estRetard ? 'retard' : 'present',
    estValide,
  });

  return {
    ...checkin.toJSON(),
    niveauConfiance:  confiance,
    messageConfiance: _messageConfiance(confiance),
  };
}

async function enregistrerSortie(idUser, payload) {
  const maintenant     = new Date();
  const { debut, fin } = bornesJourneeLocale(maintenant); // ← fuseau corrigé

  const checkin = await EmpPresenceCheckin.findOne({
    where: {
      idUser,
      debutCheckin: { [Op.between]: [debut, fin] },
      finCheckin:   null,
    },
  });

  if (!checkin) {
    throw ApiError.notFound(
      'Aucun pointage d\'entrée trouvé pour aujourd\'hui. Pointez l\'entrée d\'abord.'
    );
  }

  const dureeTravail = calculerDureeTravail(checkin.debutCheckin, maintenant);

  await checkin.update({
    finCheckin:   maintenant,
    dureeTravail,
    sourceDevice: payload.sourceDevice ?? checkin.sourceDevice,
  });

  return checkin;
}

async function statutDuJour(idUser) {
  const { debut, fin } = bornesJourneeLocale();

  const checkin = await EmpPresenceCheckin.findOne({
    where: {
      idUser,
      debutCheckin: { [Op.between]: [debut, fin] },
    },
  });

  return {
    aPointe:       !!checkin,
    estSorti:      checkin ? !!checkin.finCheckin : false,
    checkin:       checkin ?? null,
    heureEntree:   checkin?.debutCheckin  ?? null,
    heureSortie:   checkin?.finCheckin    ?? null,
    dureeTravail:  checkin?.dureeTravail  ?? null,
    estRetard:     checkin?.estRetard     ?? false,
    minutesRetard: checkin?.minutesRetard ?? 0,
    estValide:     checkin?.estValide     ?? null,
  };
}

async function statsMensuelles(idUser, mois, annee) {
  const maintenant = new Date();
  const m = mois  ?? maintenant.getUTCMonth() + 1;
  const a = annee ?? maintenant.getUTCFullYear();

  // Bornes du mois calculées selon le fuseau local configuré
  const dateReference = new Date(Date.UTC(a, m - 1, 1));

  const localeString = dateReference.toLocaleString('en-US', {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  const offsetMs = new Date(localeString).getTime() - dateReference.getTime();

  const debut = new Date(Date.UTC(a, m - 1, 1,  0,  0,  0) - offsetMs);
  const fin   = new Date(Date.UTC(a, m - 1 + 1, 0, 23, 59, 59) - offsetMs);

  const checkins = await EmpPresenceCheckin.findAll({
    where: {
      idUser,
      debutCheckin: { [Op.between]: [debut, fin] },
    },
    order: [['debutCheckin', 'ASC']],
  });

  const totalJours          = checkins.length;
  const totalRetards        = checkins.filter(c => c.estRetard).length;
  const totalMinutesTravail = checkins.reduce((acc, c) => acc + (c.dureeTravail ?? 0), 0);
  const joursComplets       = checkins.filter(c => c.finCheckin).length;
  const pointagesSuspects   = checkins.filter(c => !c.estValide).length;

  const joursOuvrables = calculerJoursOuvrables(a, m);
  const tauxAssiduite  = joursOuvrables > 0
    ? Math.round((totalJours / joursOuvrables) * 100)
    : 0;

  return {
    mois: m,
    annee: a,
    totalJoursPresents:   totalJours,
    joursComplets,
    totalRetards,
    totalMinutesTravail,
    totalHeuresTravail:   Math.floor(totalMinutesTravail / 60),
    joursOuvrables,
    tauxAssiduite,
    pointagesSuspects,
    historique:           checkins,
  };
}

async function statsEquipe(manager, mois, annee) {
  const whereUser = manager.rang.niveau === 1
    ? {}
    : { idManager: manager.id };

  const users = await User.findAll({
    where: { ...whereUser, estActif: true },
    attributes: ['id', 'nom', 'prenom', 'email'],
  });

  return Promise.all(
    users.map(async (u) => ({
      user:  u,
      stats: await statsMensuelles(u.id, mois, annee),
    }))
  );
}

// ── Utilitaire privé : message lisible selon le niveau de confiance ─────
function _messageConfiance(niveau) {
  switch (niveau) {
    case 3: return 'Pointage biométrique — confiance absolue';
    case 2: return 'IP et WiFi entreprise détectés — pointage validé automatiquement';
    case 1: return 'Réseau partiellement reconnu — pointage validé';
    case 0: return 'Réseau non reconnu — pointage en attente de validation manager';
    default: return 'Statut inconnu';
  }
}

// ── Utilitaire : jours ouvrables dans un mois ───────────────────────────
function calculerJoursOuvrables(annee, mois) {
  let count = 0;
  const date = new Date(Date.UTC(annee, mois - 1, 1));
  while (date.getUTCMonth() === mois - 1) {
    const jour = date.getUTCDay();
    if (jour !== 0 && jour !== 6) count++;
    date.setUTCDate(date.getUTCDate() + 1);
  }
  return count;
}

module.exports = {
  enregistrerEntree,
  enregistrerSortie,
  statutDuJour,
  statsMensuelles,
  statsEquipe,
};