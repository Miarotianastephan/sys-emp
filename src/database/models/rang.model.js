'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');

const Rang = sequelize.define('rang', {
  id:          { type: DataTypes.INTEGER,     primaryKey: true, autoIncrement: true },
  niveau:      { type: DataTypes.TINYINT,     allowNull: false, unique: true },
  libelle:     { type: DataTypes.STRING(60),  allowNull: false },
  description: { type: DataTypes.STRING(255), allowNull: true  },
}, { timestamps: false });

module.exports = Rang;