'use strict';

const { sequelize } = require('../../config/db');

async function closeDatabase() {
  try {
    await sequelize.close();
  } catch (_) {
    // ignore — --forceExit handles any remaining handles
  }
}

module.exports = { closeDatabase };
