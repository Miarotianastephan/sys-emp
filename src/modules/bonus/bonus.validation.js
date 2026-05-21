'use strict';

const Joi = require('joi');

const calculerSchema = Joi.object({
  mois:  Joi.number().integer().min(1).max(12).required(),
  annee: Joi.number().integer().min(2020).required(),
});

const manuelSchema = Joi.object({
  idUser:      Joi.number().integer().positive().required(),
  type:        Joi.string().valid('BONUS', 'PENALITE').required(),
  categorie:   Joi.string().valid('TACHE', 'ASSIDUITE', 'RETARD', 'ABSENCE').required(),
  libelle:     Joi.string().max(150).required(),
  montant:     Joi.number().positive().required(),
  mois:        Joi.number().integer().min(1).max(12).required(),
  annee:       Joi.number().integer().min(2020).required(),
  commentaire: Joi.string().max(2000).allow(null, ''),
});

const resumeQuerySchema = Joi.object({
  mois:  Joi.number().integer().min(1).max(12),
  annee: Joi.number().integer().min(2020),
});

const listeQuerySchema = Joi.object({
  type:      Joi.string().valid('BONUS', 'PENALITE'),
  categorie: Joi.string().valid('TACHE', 'ASSIDUITE', 'RETARD', 'ABSENCE'),
  mois:      Joi.number().integer().min(1).max(12),
  annee:     Joi.number().integer().min(2020),
  idUser:    Joi.number().integer().positive(),
  estActif:  Joi.boolean(),
});

const configCreateSchema = Joi.object({
  type:           Joi.string().valid('BONUS', 'PENALITE').required(),
  categorie:      Joi.string().valid('TACHE', 'ASSIDUITE', 'RETARD', 'ABSENCE').required(),
  libelle:        Joi.string().max(150).required(),
  valeur:         Joi.number().min(0).required(),
  seuil:          Joi.number().min(0).allow(null),
  estPourcentage: Joi.boolean().default(false),
  estActif:       Joi.boolean().default(true),
});

const configUpdateSchema = Joi.object({
  libelle:        Joi.string().max(150),
  valeur:         Joi.number().min(0),
  seuil:          Joi.number().min(0).allow(null),
  estPourcentage: Joi.boolean(),
  estActif:       Joi.boolean(),
}).min(1);

module.exports = {
  calculerSchema,
  manuelSchema,
  resumeQuerySchema,
  listeQuerySchema,
  configCreateSchema,
  configUpdateSchema,
};
