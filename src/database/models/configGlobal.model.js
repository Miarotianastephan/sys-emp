'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');

const ConfigGlobal = sequelize.define('config_global', {
  id:                        { type: DataTypes.INTEGER,      primaryKey: true, autoIncrement: true },
  baremePointBonus:          { type: DataTypes.INTEGER,      defaultValue: 75 },
  pourcentageBonusParSalaire:{ type: DataTypes.DECIMAL(5,2), defaultValue: 25.00 },
  heureEntrer:               { type: DataTypes.TIME,         defaultValue: '09:00:00' },
  tolerenceRetard:           { type: DataTypes.INTEGER,      defaultValue: 10 },
  heureSortie:               { type: DataTypes.TIME,         defaultValue: '18:10:00' },
}, { timestamps: true });

module.exports = ConfigGlobal;
