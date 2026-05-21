'use strict';

require('dotenv').config();
const mysql = require('mysql2/promise');

const DB_NAME = process.env.DB_NAME || 'gestion_personnel';

async function ensureDatabase() {
  const connection = await mysql.createConnection({
    host:     process.env.DB_HOST,
    port:     parseInt(process.env.DB_PORT, 10) || 3306,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    // no `database` — connect at server level so we can create it
  });

  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    console.log(`✅ Base de données "${DB_NAME}" prête.`);
  } finally {
    await connection.end();
  }
}

ensureDatabase().catch((err) => {
  console.error('❌ Impossible de créer la base de données :', err.message);
  process.exit(1);
});
