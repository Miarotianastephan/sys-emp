'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');

const EmpPoint = sequelize.define('emp_point', {
  id:               { type: DataTypes.INTEGER,                                primaryKey: true, autoIncrement: true },
  idUser:           { type: DataTypes.INTEGER,                                allowNull: false },
  idConfigEmpPoint: { type: DataTypes.INTEGER,                                allowNull: false },
  points:           { type: DataTypes.INTEGER,                                allowNull: false },
  dateAttribution:  { type: DataTypes.DATE,                                   allowNull: false },
  dateFinSemaine:   { type: DataTypes.DATEONLY,                               allowNull: true  },
  source:           { type: DataTypes.ENUM('PRESENCE', 'ABSENCE', 'PENALITE', 'MANUEL'), allowNull: false },
  idSource:         { type: DataTypes.INTEGER,                                allowNull: true  },
  commentaire:      { type: DataTypes.STRING(255),                            allowNull: true  },
}, { timestamps: false, createdAt: 'createdAt' });

module.exports = EmpPoint;
