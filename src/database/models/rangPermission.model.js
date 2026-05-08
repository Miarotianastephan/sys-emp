'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');

const RangPermission = sequelize.define('rang_permission', {
  id:           { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  idRang:       { type: DataTypes.INTEGER, allowNull: false },
  idPermission: { type: DataTypes.INTEGER, allowNull: false },
}, { timestamps: false });

module.exports = RangPermission;