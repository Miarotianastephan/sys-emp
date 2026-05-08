'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');

const ConfigAbsence = sequelize.define('config_absence', {
  id:                    { type: DataTypes.INTEGER,                    primaryKey: true, autoIncrement: true },
  typeAbsence:           { type: DataTypes.ENUM('OFF', 'CONGE'),       allowNull: false, unique: true },
  joursAutorises:        { type: DataTypes.INTEGER,                    allowNull: false },
  joursAvantAutorisation:{ type: DataTypes.INTEGER,                    allowNull: false },
  estActif:              { type: DataTypes.BOOLEAN,                    defaultValue: true },
}, { timestamps: true });

module.exports = ConfigAbsence;
