'use strict';

const Joi = require('joi');

const createSchema = Joi.object({
  idConfigTask:  Joi.number().integer().positive().allow(null).default(null),
  idUserAssigne: Joi.number().integer().positive().required(),
  titre:         Joi.string().max(150).required(),
  description:   Joi.string().allow(null, ''),
  dateDebut:     Joi.date().iso().required(),
  dateLimite:    Joi.date().iso().greater(Joi.ref('dateDebut')).required()
    .messages({ 'date.greater': 'dateLimite doit être postérieure à dateDebut' }),
  poids:         Joi.number().integer().min(1).max(5).default(1),
  priorite:      Joi.string().valid('BASSE', 'NORMALE', 'HAUTE').default('NORMALE'),
  commentaire:   Joi.string().max(1000).allow(null, ''),
});

const updateSchema = Joi.object({
  titre:       Joi.string().max(150),
  description: Joi.string().allow(null, ''),
  dateDebut:   Joi.date().iso(),
  dateLimite:  Joi.date().iso(),
  poids:       Joi.number().integer().min(1).max(5),
  priorite:    Joi.string().valid('BASSE', 'NORMALE', 'HAUTE'),
  commentaire: Joi.string().max(1000).allow(null, ''),
}).min(1);

const completeSchema = Joi.object({
  commentaire: Joi.string().max(1000).allow(null, ''),
});

const listQuerySchema = Joi.object({
  statut:   Joi.string().valid('EN_COURS', 'TERMINE', 'EN_RETARD'),
  priorite: Joi.string().valid('BASSE', 'NORMALE', 'HAUTE'),
  mois:     Joi.number().integer().min(1).max(12),
  annee:    Joi.number().integer().min(2020),
});

const statsQuerySchema = Joi.object({
  mois:  Joi.number().integer().min(1).max(12),
  annee: Joi.number().integer().min(2020),
});

module.exports = {
  createSchema,
  updateSchema,
  completeSchema,
  listQuerySchema,
  statsQuerySchema,
};
