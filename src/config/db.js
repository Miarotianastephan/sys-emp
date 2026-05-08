'use strict';

const { Sequelize } = require('sequelize');
const env           = require('./env');

const sequelize = new Sequelize(
  env.db.database,
  env.db.user,
  env.db.password,
  {
    host:    env.db.host,
    port:    env.db.port,
    dialect: 'mysql',
    timezone: '+00:00',
    logging: env.isProd ? false : (sql) => console.log(`\x1b[36m[SQL]\x1b[0m ${sql}`),
    pool: {
      max:     10,
      min:     0,
      acquire: 30000,
      idle:    10000,
    },
    define: {
      charset:         'utf8mb4',
      freezeTableName: true,
      timestamps:      true,
    },
  }
);

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL connecté via Sequelize :', env.db.database);
  } catch (err) {
    console.error('❌ Connexion MySQL échouée :', err.message);
    process.exit(1);
  }
}

module.exports = { sequelize, testConnection };