'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');

const ConfigTask = sequelize.define('config_task', {
  id:          { type: DataTypes.INTEGER,     primaryKey: true, autoIncrement: true },
  titre:       { type: DataTypes.STRING(150), allowNull: false },
  description: { type: DataTypes.TEXT,        allowNull: true  },
  estActif:    { type: DataTypes.BOOLEAN,     allowNull: false, defaultValue: true },
}, { timestamps: true });

module.exports = ConfigTask;
