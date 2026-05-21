'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');

const EmpTask = sequelize.define('emp_task', {
  id:             { type: DataTypes.INTEGER,                                    primaryKey: true, autoIncrement: true },
  idConfigTask:   { type: DataTypes.INTEGER,                                    allowNull: true  },
  idUserAssigne:  { type: DataTypes.INTEGER,                                    allowNull: false },
  idUserCreateur: { type: DataTypes.INTEGER,                                    allowNull: false },
  titre:          { type: DataTypes.STRING(150),                                allowNull: false },
  description:    { type: DataTypes.TEXT,                                       allowNull: true  },
  dateDebut:      { type: DataTypes.DATEONLY,                                   allowNull: false },
  dateLimite:     { type: DataTypes.DATEONLY,                                   allowNull: false },
  dateCompletion: { type: DataTypes.DATEONLY,                                   allowNull: true  },
  poids:          { type: DataTypes.INTEGER,                                    allowNull: false, defaultValue: 1 },
  statut:         { type: DataTypes.ENUM('EN_COURS', 'TERMINE', 'EN_RETARD'),  allowNull: false, defaultValue: 'EN_COURS' },
  priorite:       { type: DataTypes.ENUM('BASSE', 'NORMALE', 'HAUTE'),         allowNull: false, defaultValue: 'NORMALE' },
  commentaire:    { type: DataTypes.TEXT,                                       allowNull: true  },
}, { timestamps: true });

module.exports = EmpTask;
