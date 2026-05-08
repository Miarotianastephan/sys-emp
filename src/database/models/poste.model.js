'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');

const Poste = sequelize.define('poste', {
  id:            { type: DataTypes.INTEGER,    primaryKey: true, autoIncrement: true },
  rolePredefini: { type: DataTypes.ENUM('Developpeur','Testeur','Marketing','Support','Cloud','Autre'), allowNull: false },
  estActif:      { type: DataTypes.BOOLEAN,     defaultValue: true },
  createdAt:     { type: DataTypes.DATE,        allowNull: false, defaultValue: DataTypes.NOW },
}, { timestamps: false });

module.exports = Poste;