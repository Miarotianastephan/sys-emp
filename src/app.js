'use strict';

const express      = require('express');
const helmet       = require('helmet');
const cors         = require('cors');
const morgan       = require('morgan');
const errorHandler = require('./middlewares/errorHandler');
const env          = require('./config/env');

// ── Import des routes ──────────────────────────────────────
const authRoutes = require('./modules/auth/auth.routes');
const presenceRoutes = require('./modules/presence/presence.routes');
// const userRoutes   = require('./modules/users/user.routes');    // à venir
// const presenceRoutes = require('./modules/presence/presence.routes');

const app = express();

// ── Sécurité & parsing ────────────────────────────────────
app.use(helmet());   // headers de sécurité HTTP
app.use(cors());     // à restreindre en production avec { origin: 'https://...' }
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Logs HTTP ─────────────────────────────────────────────
if (!env.isProd) {
  app.use(morgan('dev'));          // logs colorés en développement
} else {
  app.use(morgan('combined'));     // logs standards en production
}

// ── Routes ────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/presence', presenceRoutes);
// app.use('/api/users',    userRoutes);
// app.use('/api/presence', presenceRoutes);

// ── Health check ──────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', env: env.nodeEnv, timestamp: new Date().toISOString() });
});

// ── 404 — route non trouvée ───────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route ${req.method} ${req.path} introuvable` });
});

// ── Gestionnaire d'erreurs global (TOUJOURS EN DERNIER) ──
app.use(errorHandler);

module.exports = app;
