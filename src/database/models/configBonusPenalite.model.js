'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');

const ConfigBonusPenalite = sequelize.define('config_bonus_penalite', {
  id:             { type: DataTypes.INTEGER,                                        primaryKey: true, autoIncrement: true },
  type:           { type: DataTypes.ENUM('BONUS', 'PENALITE'),                      allowNull: false },
  categorie:      { type: DataTypes.ENUM('TACHE', 'ASSIDUITE', 'RETARD', 'ABSENCE'), allowNull: false },
  libelle:        { type: DataTypes.STRING(150),                                    allowNull: false },
  valeur:         { type: DataTypes.DECIMAL(10, 2),                                 allowNull: false },
  seuil:          { type: DataTypes.DECIMAL(10, 2),                                 allowNull: true  },
  estPourcentage: { type: DataTypes.BOOLEAN,                                        defaultValue: false },
  estActif:       { type: DataTypes.BOOLEAN,                                        defaultValue: true  },
}, { timestamps: true, tableName: 'config_bonus_penalite' });

module.exports = ConfigBonusPenalite;
