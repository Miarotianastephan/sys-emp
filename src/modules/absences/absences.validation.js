'use strict';

const Joi = require('joi');

const demandeSchema = Joi.object({
  idConfigAbsence: Joi.number().integer().positive().required(),
  dateDebutAbsence: Joi.date().iso().required(),
  dateFinAbsence: Joi.date().iso().required(),
  typeJournee: Joi.string().valid('JOURNEE', 'MATIN', 'APRES_MIDI').default('JOURNEE'),
  priorite: Joi.string().valid('BASSE', 'NORMALE', 'HAUTE').default('NORMALE'),
  motif: Joi.string().max(500).allow(null, ''),
});

const querySchema = Joi.object({
  statut: Joi.string().valid('ATTENTE', 'VALIDE', 'REFUSE'),
  mois: Joi.number().integer().min(1).max(12),
  annee: Joi.number().integer().min(1970),
});

const validationSchema = Joi.object({
  statut: Joi.string().valid('VALIDE', 'REFUSE').required(),
  commentaireValidateur: Joi.string().max(500).allow(null, ''),
});

module.exports = {
  demandeSchema,
  querySchema,
  validationSchema,
};
