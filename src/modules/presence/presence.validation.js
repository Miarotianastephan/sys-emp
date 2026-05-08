'use strict';
const Joi = require('joi');

const entreeSchema = Joi.object({
  methode:      Joi.string()
                   .valid('manuel','wifi','qr','gps','empreinte','facial')
                   .default('manuel'),
  ipAddress:    Joi.string().ip({ version: ['ipv4','ipv6'] }).optional().allow(null,''),
  ssidReseau:   Joi.string().max(100).optional().allow(null,''),
  sourceDevice: Joi.string().max(100).optional().allow(null,''),
  latitude:     Joi.number().min(-90).max(90).optional().allow(null),
  longitude:    Joi.number().min(-180).max(180).optional().allow(null),
});

const sortieSchema = Joi.object({
  sourceDevice: Joi.string().max(100).optional().allow(null,''),
});

const statsQuerySchema = Joi.object({
  mois:   Joi.number().integer().min(1).max(12).optional(),
  annee:  Joi.number().integer().min(2020).max(2100).optional(),
  idUser: Joi.number().integer().optional(), // manager seulement
});

module.exports = { entreeSchema, sortieSchema, statsQuerySchema };