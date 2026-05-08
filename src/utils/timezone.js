'use strict';

const TIMEZONE = process.env.APP_TIMEZONE || Intl.DateTimeFormat().resolvedOptions().timeZone;
const { ConfigGlobal } = require('../database/models'); 

async function _getDebutTravailLocal(){ 
  const config = await ConfigGlobal.findOne({ attributes: ['heureEntrer'] });
  const heureDebut = config ? config.heureEntrer : '09:00';
  const [heure, minute] = heureDebut.split(':').map(Number);
  console.log('Heure de début de travail locale configurée :', heure, 'h', minute, 'min');
  return { heure, minute };
}

function getOffsetMs(date = new Date()) {
  const localeString = date.toLocaleString('en-US', {
    timeZone: TIMEZONE,
  });

  const localeDate = new Date(localeString);
  return localeDate.getTime() - date.getTime();
}

/**
 * Retourne l'heure actuelle.
 * Les calculs métier utilisent automatiquement
 * le fuseau configuré via Intl/timezone.
 */
function maintenant() {
  return new Date();
}

/**
 * Convertit une date UTC en heure locale Madagascar.
 * Utilisé uniquement pour l'affichage et les comparaisons métier.
 */
function enHeureLocale(date) {
  return new Date(
    new Date(date).toLocaleString('en-US', {
      timeZone: TIMEZONE,
    })
  );
}

/**
 * Retourne les bornes UTC d'une journée
 * calculées selon le fuseau local configuré.
 */
function bornesJourneeLocale(date = new Date()) {
  const offsetMs = getOffsetMs(date);

  const dateLocale = new Date(date.getTime() + offsetMs);

  const debutLocal = new Date(Date.UTC(
    dateLocale.getUTCFullYear(),
    dateLocale.getUTCMonth(),
    dateLocale.getUTCDate(),
    0, 0, 0, 0
  ));

  const finLocal = new Date(Date.UTC(
    dateLocale.getUTCFullYear(),
    dateLocale.getUTCMonth(),
    dateLocale.getUTCDate(),
    23, 59, 59, 999
  ));

  return {
    debut: new Date(debutLocal.getTime() - offsetMs),
    fin:   new Date(finLocal.getTime()   - offsetMs),
  };
}

/**
 * Retourne l'heure de début de travail UTC
 * selon le fuseau horaire configuré.
 */
async function heureDebutTravailUTC(date = new Date()) {
  const offsetMs = getOffsetMs(date);
  const dateLocale = new Date(date.getTime() + offsetMs);

  const { heure: heureLocale, minute: minuteLocale } = await _getDebutTravailLocal();

  // Définir l'heure locale à l'heure de début de travail
  dateLocale.setHours(heureLocale, minuteLocale, 0, 0);

  console.log('Date locale ajustée :', dateLocale.toISOString());
  console.log('Offset :', offsetMs, 'ms');

  // Reconvertir en UTC
  const heureTheoriqueUTC = new Date(dateLocale.getTime() - offsetMs);
  console.log('Heure de début de travail UTC calculée :', heureTheoriqueUTC.toISOString());

  return heureTheoriqueUTC;
}

module.exports = {
  maintenant,
  enHeureLocale,
  bornesJourneeLocale,
  heureDebutTravailUTC,
  TIMEZONE,
  getOffsetMs,
};