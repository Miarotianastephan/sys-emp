'use strict';

const Joi = require('joi');

const notificationReadSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

module.exports = {
  notificationReadSchema,
};
