'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');

const Permission = sequelize.define('permission', {
  id:          { type: DataTypes.INTEGER,     primaryKey: true, autoIncrement: true },
  code:        { type: DataTypes.STRING(80),  allowNull: false, unique: true },
  description: { type: DataTypes.STRING(255), allowNull: true  },
}, { timestamps: false });

module.exports = Permission;