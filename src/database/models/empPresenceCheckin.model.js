'use strict';
const { DataTypes } = require('sequelize');
const { sequelize }  = require('../../config/db');

const EmpPresenceCheckin = sequelize.define(
  'emp_presence_checkin',
  {
    id: {
      type:          DataTypes.INTEGER,
      primaryKey:    true,
      autoIncrement: true,
    },

    idUser: {
      type:      DataTypes.INTEGER,
      allowNull: false,
    },

    /* ── Horodatage ─────────────────────────────────────────── */
    debutCheckin: {
      type:      DataTypes.DATE,
      allowNull: false,
    },
    finCheckin: {
      type:      DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },

    /* Durée en MINUTES (calculée à la sortie) */
    dureeTravail: {
      type:      DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },

    /* ── Méthode de pointage ─────────────────────────────────── */
    methode: {
      type: DataTypes.ENUM(
        'manuel',
        'wifi',
        'qr',
        'gps',
        'empreinte',
        'facial'
      ),
      allowNull:    false,
      defaultValue: 'manuel',
    },

    /* ── Traçabilité réseau ───────────────────────────────────── */
    ipAddress: {
      type:      DataTypes.STRING(45),   // supporte IPv4 + IPv6
      allowNull: true,
      defaultValue: null,
    },
    ssidReseau: {
      type:      DataTypes.STRING(100),
      allowNull: true,
      defaultValue: null,
    },
    sourceDevice: {
      type:      DataTypes.STRING(100),  // 'web', 'mobile', 'terminal-A1'
      allowNull: true,
      defaultValue: null,
    },

    /* ── Géolocalisation (GPS / géofencing futur) ────────────── */
    latitude: {
      type:      DataTypes.DECIMAL(9, 6),
      allowNull: true,
      defaultValue: null,
    },
    longitude: {
      type:      DataTypes.DECIMAL(9, 6),
      allowNull: true,
      defaultValue: null,
    },

    /* ── Statut & retards ────────────────────────────────────── */
    estRetard: {
      type:         DataTypes.BOOLEAN,
      allowNull:    false,
      defaultValue: false,
    },
    minutesRetard: {
      type:         DataTypes.INTEGER,
      allowNull:    false,
      defaultValue: 0,
    },
    estAbsent: {
      type:         DataTypes.BOOLEAN,
      allowNull:    false,
      defaultValue: false,
    },
    statut: {
      type: DataTypes.ENUM(
        'present',
        'absent',
        'retard',
        'conge',
        'ferie'
      ),
      allowNull:    false,
      defaultValue: 'present',
    },

    justification: {
      type:      DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },

    /* ── Validation (issu de ton modèle d'origine) ───────────── */
    estValide: {
      type:         DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName:  'emp_presence_checkin',
    timestamps: true,                  // createdAt + updatedAt gérés par Sequelize
    indexes: [
      {
        // Un seul pointage d'entrée par jour et par utilisateur
        unique: true,
        name:   'uq_user_date',
        fields: [
          'idUser',
          sequelize.fn('DATE', sequelize.col('debutCheckin')),
        ],
      },
    ],
  }
);

module.exports = EmpPresenceCheckin;