'use strict';

/**
 * simulateData.js — generates realistic presence and task data for tests.
 *
 * TIMEZONE STRATEGY:
 *   All date/time computation is delegated to the same functions the application
 *   uses (getOffsetMs, bornesJourneeLocale from src/utils/timezone.js), so tests
 *   remain consistent regardless of the server's local timezone.
 *
 * WORKING-HOURS CONVENTION:
 *   Start of work is read from ConfigGlobal.heureEntrer (default '09:00:00').
 *   End of work is hardcoded to 18:00 local (heureSortie in seeder = '18:00:00').
 *   A late arrival is exactly +10 minutes past the configured start time.
 */

const { Op }  = require('sequelize');
const { EmpPresenceCheckin, EmpTask, ConfigGlobal } = require('../../database/models');

// Import EXACTLY the timezone utilities the application uses.
const {
  getOffsetMs,
  bornesJourneeLocale,
  TIMEZONE,
} = require('../../utils/timezone');

// ── Internal helpers ──────────────────────────────────────────────────────────

/**
 * Reads heureEntrer from ConfigGlobal once.
 * Returns { heureLocale, minuteLocale }.
 */
async function _getWorkStart() {
  const config = await ConfigGlobal.findOne({ attributes: ['heureEntrer'] });
  const raw    = config ? String(config.heureEntrer) : '09:00:00';
  const [h, m] = raw.split(':').map(Number);
  return { heureLocale: h, minuteLocale: m };
}

/**
 * Converts a 'YYYY-MM-DD' local-date string to a UTC Date at the given
 * local time (heureLocale:minuteLocale:00).
 *
 * Mirrors the logic inside heureDebutTravailUTC exactly:
 *   dateLocale = new Date(refTime + offsetMs)
 *   dateLocale.setHours(h, m, 0, 0)          ← runtime-local setHours
 *   return new Date(dateLocale.getTime() - offsetMs)
 */
function _localTimeToUTC(dateStr, heureLocale, minuteLocale) {
  // Use UTC noon as a stable reference inside the calendar day
  const refDate  = new Date(`${dateStr}T12:00:00Z`);
  const offsetMs = getOffsetMs(refDate);

  const dateLocale = new Date(refDate.getTime() + offsetMs);
  dateLocale.setHours(heureLocale, minuteLocale, 0, 0); // runtime-local, same as app
  return new Date(dateLocale.getTime() - offsetMs);
}

/**
 * Returns all weekday date-strings ('YYYY-MM-DD') in the LOCAL calendar for
 * the given annee/mois.  "Local" is determined by getOffsetMs, matching the
 * application's own bornesJourneeLocale logic.
 */
function _localWeekdaysInMonth(annee, mois) {
  const pad  = (n) => String(n).padStart(2, '0');
  const days = new Date(annee, mois, 0).getDate(); // last day of month
  const weekdays = [];

  for (let day = 1; day <= days; day++) {
    const dateStr  = `${annee}-${pad(mois)}-${pad(day)}`;
    const refDate  = new Date(`${dateStr}T12:00:00Z`);
    const offsetMs = getOffsetMs(refDate);
    // Shift to local time to read the weekday in the configured timezone
    const localDate = new Date(refDate.getTime() + offsetMs);
    const dow = localDate.getUTCDay(); // 0=Sun, 6=Sat
    if (dow !== 0 && dow !== 6) weekdays.push(dateStr);
  }

  return weekdays;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * simulatePresenceMonth(idUser, annee, mois, options)
 *
 * Inserts emp_presence_checkin records for the given user/month.
 *
 * options:
 *   joursPresents      — number of weekdays to simulate (default: all)
 *   nombreRetards      — first N days are marked as late  (default: 0)
 *
 * Idempotent: uses ignoreDuplicates so re-runs are safe.
 */
async function simulatePresenceMonth(idUser, annee, mois, options = {}) {
  const { joursPresents = null, nombreRetards = 0 } = options;

  const { heureLocale, minuteLocale } = await _getWorkStart();

  const allWeekdays = _localWeekdaysInMonth(annee, mois);
  const selected    = joursPresents !== null
    ? allWeekdays.slice(0, joursPresents)
    : allWeekdays;

  const records = [];

  for (let i = 0; i < selected.length; i++) {
    const dateStr = selected[i];
    const isLate  = i < nombreRetards;

    // debutCheckin: 09:00 local (or 09:10 if late)
    const debutCheckin = _localTimeToUTC(
      dateStr,
      heureLocale,
      isLate ? minuteLocale + 10 : minuteLocale
    );

    // finCheckin: 18:00 local
    const finCheckin = _localTimeToUTC(dateStr, 18, 0);

    const dureeTravail = Math.round(
      (finCheckin.getTime() - debutCheckin.getTime()) / 60_000
    );

    records.push({
      idUser,
      debutCheckin,
      finCheckin,
      dureeTravail,
      methode:      'manuel',
      estRetard:    isLate,
      minutesRetard: isLate ? 10 : 0,
      statut:       isLate ? 'retard' : 'present',
      estValide:    true,
      ipAddress:    null,
      ssidReseau:   null,
      sourceDevice: 'test-simulator',
    });
  }

  await EmpPresenceCheckin.bulkCreate(records, { ignoreDuplicates: true });
  return records;
}

/**
 * clearPresenceData(idUser, annee, mois)
 *
 * Deletes all presence records for idUser in the given month.
 * Uses the same month-boundary calculation as statsMensuelles.
 */
async function clearPresenceData(idUser, annee, mois) {
  // Mirror statsMensuelles month-boundary computation
  const dateReference = new Date(Date.UTC(annee, mois - 1, 1));
  const offsetMs = getOffsetMs(dateReference);

  const debut = new Date(Date.UTC(annee, mois - 1,     1,  0,  0,  0) - offsetMs);
  const fin   = new Date(Date.UTC(annee, mois,          0, 23, 59, 59) - offsetMs);

  await EmpPresenceCheckin.destroy({
    where: {
      idUser,
      debutCheckin: { [Op.between]: [debut, fin] },
    },
  });
}

/**
 * simulateTaskCompletion(idTask, wasLate)
 *
 * Marks a task as TERMINE. If wasLate=true the completion date is dateLimite+5.
 */
async function simulateTaskCompletion(idTask, wasLate = false) {
  const task = await EmpTask.findByPk(idTask);
  if (!task) throw new Error(`simulateTaskCompletion: task ${idTask} not found`);

  let dateCompletion;
  if (wasLate) {
    const lim = new Date(task.dateLimite);
    lim.setDate(lim.getDate() + 5);
    dateCompletion = lim.toISOString().slice(0, 10);
  } else {
    dateCompletion = new Date().toISOString().slice(0, 10);
  }

  await task.update({ statut: 'TERMINE', dateCompletion });
  return task.reload();
}

module.exports = {
  simulatePresenceMonth,
  clearPresenceData,
  simulateTaskCompletion,
};
