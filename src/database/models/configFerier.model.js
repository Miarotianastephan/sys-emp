'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');

const ConfigFerier = sequelize.define('config_ferier', {
  id:         { type: DataTypes.INTEGER,     primaryKey: true, autoIncrement: true },
  dateFerie:  { type: DataTypes.DATEONLY,    allowNull: false, unique: true },
  description:{ type: DataTypes.STRING(150), allowNull: false },
  estRecurrent:{ type: DataTypes.BOOLEAN,    defaultValue: false },
}, { timestamps: true });

module.exports = ConfigFerier;
