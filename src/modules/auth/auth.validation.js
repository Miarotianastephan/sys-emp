'use strict';
const Joi = require('joi');

const registerSchema = Joi.object({
  nom:        Joi.string().trim().min(2).max(80).required(),
  prenom:     Joi.string().trim().min(2).max(80).required(),
  email:      Joi.string().email().lowercase().required(),
  motDePasse: Joi.string().min(8).required().messages({
    'string.min': 'Le mot de passe doit contenir au moins 8 caractères',
  }),
  telephone:     Joi.string().max(20).optional().allow('', null),
  dateNaissance: Joi.date().iso().optional().allow(null),
  dateEmbauche:  Joi.date().iso().required(),
  salaire:       Joi.number().precision(2).optional().allow(null),
  idPoste:       Joi.number().integer().optional().allow(null),
  idRang:        Joi.number().integer().required(),
  idManager:     Joi.number().integer().optional().allow(null),
});

const loginSchema = Joi.object({
  email:      Joi.string().email().required(),
  motDePasse: Joi.string().required(),
});

module.exports = { registerSchema, loginSchema };
