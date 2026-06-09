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
const absencesRoutes = require('./modules/absences/absences.routes');
const notificationsRoutes = require('./modules/notifications/notification.routes');
const ferierRoutes = require('./modules/ferier/ferier.routes');
const taskRoutes   = require('./modules/tasks/task.routes');
const bonusRoutes  = require('./modules/bonus/bonus.routes');

const app = express();
// Configuration CORS
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:30400',
    'http://192.168.1.10',
    'http://192.168.1.10:30400',
    'http://192.168.1.10:29189',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// ── Sécurité & parsing ────────────────────────────────────
app.use(helmet());  
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Logs HTTP ─────────────────────────────────────────────
if (!env.isProd) {
  app.use(morgan('dev'));         
} else {
  app.use(morgan('combined'));  
}

// ── Routes ────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/presence', presenceRoutes);
app.use('/api/absences', absencesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/feriers', ferierRoutes);
app.use('/api/tasks',   taskRoutes);
app.use('/api/bonus',   bonusRoutes);

// ── Health check ──────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', env: env.nodeEnv, timestamp: new Date().toISOString() });
});

// ── 404 — route non trouvée ───────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route ${req.method} ${req.path} introuvable` });
});

// ── Gestionnaire d'erreurs global  ──
app.use(errorHandler);

module.exports = app;
