'use strict';

const PLAGES_ENTREPRISE = (process.env.IP_ENTREPRISE_PLAGES || '')
  .split(',')
  .map(p => p.trim())
  .filter(Boolean);

const SSID_AUTORISE = (process.env.SSID_ENTREPRISE || '').trim();

function estIPEntreprise(ipAddress) {
  if (!ipAddress || PLAGES_ENTREPRISE.length === 0) return false;
  return PLAGES_ENTREPRISE.some(plage => ipAddress.startsWith(plage));
}

function estSSIDEntreprise(ssid) {
  if (!ssid || !SSID_AUTORISE) return false;
  return ssid === SSID_AUTORISE;
}

function niveauConfiance({ ipAddress, ssidReseau, methode }) {
  if (['empreinte', 'facial'].includes(methode)) return 3;
  const ipOk   = estIPEntreprise(ipAddress);
  const ssidOk = estSSIDEntreprise(ssidReseau);
  if (ipOk && ssidOk) return 2;
  if (ipOk || ssidOk) return 1;
  return 0;
}

module.exports = { estIPEntreprise, estSSIDEntreprise, niveauConfiance };