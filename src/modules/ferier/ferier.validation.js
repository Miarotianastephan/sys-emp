'use strict';

const Joi = require('joi');

const createSchema = Joi.object({
    dateFerie: Joi.date().iso().required().messages({
        'date.base': 'La date doit être au format ISO (YYYY-MM-DD).',
        'any.required': 'La date du jour férié est requise.',
    }),
    description: Joi.string().min(3).max(150).required().messages({
        'string.base': 'La description doit être une chaîne de caractères.',
        'string.min': 'La description doit contenir au moins 3 caractères.',
        'string.max': 'La description ne peut pas dépasser 150 caractères.',
        'any.required': 'La description du jour férié est requise.',
    }),
    estRecurrent: Joi.boolean().default(false).messages({
        'boolean.base': "Le champ 'estRecurrent' doit être un booléen.",
    }),
})

const updateSchema = Joi.object({
  dateFerie:    Joi.date().iso().optional(),
  description:  Joi.string().trim().min(3).max(150).optional(),
  estRecurrent: Joi.boolean().optional(),
}).min(1).messages({
  'object.min': 'Au moins un champ est requis pour la mise à jour',
});

const listQuerySchema = Joi.object({
  annee:  Joi.number().integer().min(2020).max(2100).optional(),
  actifs: Joi.boolean().optional(),
});

module.exports = { createSchema, updateSchema, listQuerySchema };