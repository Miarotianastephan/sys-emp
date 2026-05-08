'use strict';

const app                    = require('./app');
const env                    = require('./config/env');
const { testConnection, sequelize } = require('./config/db');

let server;

async function start() {
  // Vérifie la connexion MySQL avant de démarrer le serveur
  await testConnection();

  server = app.listen(env.port, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${env.port}`);
    console.log(`📦 Environnement : ${env.nodeEnv}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Le port ${env.port} est déjà utilisé. Change le port ou libère le port ${env.port} puis relance.`);
    } else {
      console.error('❌ Erreur de démarrage du serveur :', err.message);
    }
    process.exit(1);
  });

  const cleanup = async () => {
    try {
      await sequelize.close();
      console.log('✅ Connexion Sequelize fermée');
    } catch (closeErr) {
      console.error('❌ Erreur lors de la fermeture de la connexion DB :', closeErr.message || closeErr);
    }
  };

  const shutdown = async (signal) => {
    console.log(`\n🛑 Signal ${signal} reçu — arrêt du serveur...`);

    const forceExit = setTimeout(() => {
      console.warn('⚠️ Arrêt forcé après 10 secondes');
      process.exit(1);
    }, 10000);
    forceExit.unref();

    if (server && server.listening) {
      server.close(async (closeErr) => {
        if (closeErr) {
          console.error('❌ Erreur lors de la fermeture du serveur :', closeErr.message || closeErr);
        } else {
          console.log('✅ Serveur arrêté proprement');
        }
        await cleanup();
        process.exit(0);
      });
    } else {
      await cleanup();
      process.exit(0);
    }
  };

  process.on('SIGINT',  () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('uncaughtException', (err) => {
    console.error('❌ Exception non gérée :', err);
    shutdown('uncaughtException');
  });
  process.on('unhandledRejection', (reason) => {
    console.error('❌ Rejet de promesse non géré :', reason);
    shutdown('unhandledRejection');
  });
}

start().catch((err) => {
  console.error('❌ Erreur au démarrage :', err.message || err);
  process.exit(1);
});
