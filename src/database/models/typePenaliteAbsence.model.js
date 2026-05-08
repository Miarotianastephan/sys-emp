'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');

const TypePenaliteAbsence = sequelize.define('type_penalite_absence', {
  id:          { type: DataTypes.INTEGER,           primaryKey: true, autoIncrement: true },
  code:        { type: DataTypes.ENUM('P1','P2','P3','P4'), allowNull: false, unique: true },
  titre:       { type: DataTypes.STRING(100),       allowNull: false },
  malus:       { type: DataTypes.INTEGER,           allowNull: false },
  description: { type: DataTypes.STRING(255),       allowNull: true  },
  estActif:    { type: DataTypes.BOOLEAN,           defaultValue: true },
}, { timestamps: true });

module.exports = TypePenaliteAbsence;
