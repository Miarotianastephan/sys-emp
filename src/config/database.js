'use strict';
require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host:     process.env.DB_HOST,
    port:     parseInt(process.env.DB_PORT, 10) || 3306,
    dialect:  'mysql',
    timezone: '+00:00',
    logging:  console.log,   // affiche les requêtes SQL générées en dev
    define: {
      charset:         'utf8mb4',
      collate:         'utf8mb4_unicode_ci',
      underscored:     false,  // garde le camelCase de tes colonnes
      freezeTableName: true,   // Sequelize ne pluralise pas les noms de tables
      timestamps:      true,   // ajoute createdAt et updatedAt automatiquement
    },
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host:     process.env.DB_HOST,
    port:     parseInt(process.env.DB_PORT, 10) || 3306,
    dialect:  'mysql',
    timezone: '+00:00',
    logging:  false,   // pas de logs SQL en production
    define: {
      charset:         'utf8mb4',
      collate:         'utf8mb4_unicode_ci',
      underscored:     false,
      freezeTableName: true,
      timestamps:      true,
    },
  },
};