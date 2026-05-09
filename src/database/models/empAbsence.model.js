'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');

const EmpAbsence = sequelize.define('emp_absence', {
  id:                { type: DataTypes.INTEGER,                                        primaryKey: true, autoIncrement: true },
  idConfigAbsence:   { type: DataTypes.INTEGER,                                        allowNull: false },
  idUserDemandeur:   { type: DataTypes.INTEGER,                                        allowNull: false },
  idUserValidateur:  { type: DataTypes.INTEGER,                                        allowNull: true  },
  dateDemande:       { type: DataTypes.DATE,                                           allowNull: false },
  dateDebutAbsence:  { type: DataTypes.DATEONLY,                                       allowNull: false },
  dateFinAbsence:    { type: DataTypes.DATEONLY,                                       allowNull: false },
  nombreJours:       { type: DataTypes.DECIMAL(5, 2),                                  allowNull: false, defaultValue: 0 },
  typeJournee:       { type: DataTypes.ENUM('JOURNEE', 'MATIN', 'APRES_MIDI'),        defaultValue: 'JOURNEE' },
  statut:            { type: DataTypes.ENUM('ATTENTE', 'VALIDE', 'REFUSE'),          defaultValue: 'ATTENTE' },
  priorite:          { type: DataTypes.ENUM('BASSE', 'NORMALE', 'HAUTE'),            defaultValue: 'NORMALE' },
  motif:             { type: DataTypes.STRING(255),                                    allowNull: true  },
  commentaireValidateur: { type: DataTypes.TEXT,                                       allowNull: true },
  vueParValidateur: { type: DataTypes.BOOLEAN,                                        allowNull: false, defaultValue: false },
}, { timestamps: true });

module.exports = EmpAbsence;
