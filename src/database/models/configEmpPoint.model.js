'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');

const ConfigEmpPoint = sequelize.define('config_emp_point', {
  id:           { type: DataTypes.INTEGER,              primaryKey: true, autoIncrement: true },
  typePoint:    { type: DataTypes.ENUM('BONUS', 'MALUS'), allowNull: false },
  code:         { type: DataTypes.STRING(50),           allowNull: false, unique: true },
  valeur:       { type: DataTypes.INTEGER,              allowNull: false },
  estFixe:      { type: DataTypes.BOOLEAN,              defaultValue: true },
  estActif:     { type: DataTypes.BOOLEAN,              defaultValue: true },
  dateCreation: { type: DataTypes.DATE,                 defaultValue: DataTypes.NOW },
  dateArchivage:{ type: DataTypes.DATE,                 allowNull: true  },
  description:  { type: DataTypes.STRING(255),          allowNull: true  },
}, { timestamps: false });

module.exports = ConfigEmpPoint;
