'use strict';
const path = require('path');
const envFile = process.env.NODE_ENV === 'production'
  ? '.env.production'
  : process.env.NODE_ENV === 'development'
    ? '.env.dev'
    : '.env';

require('dotenv').config({
  path: path.resolve(process.cwd(), envFile)
});

const required = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET'];

required.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Variable d'environnement manquante : ${key}`);
  }
});

module.exports = {
  port:    parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd:  process.env.NODE_ENV === 'production',
  baseUrl: process.env.NODE_ENV == 'production' ?
    'http://192.168.1.10' : 'http://localhost',
  db: {
    host:     process.env.DB_HOST,
    port:     parseInt(process.env.DB_PORT, 10) || 3306,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },

  jwt: {
    secret:    process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  },

  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,
};