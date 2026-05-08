'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');

const EmpPenaliteAbsence = sequelize.define('emp_penalite_absence', {
  id:            { type: DataTypes.INTEGER,  primaryKey: true, autoIncrement: true },
  idUser:        { type: DataTypes.INTEGER,  allowNull: false },
  idTypePenalite:{ type: DataTypes.INTEGER,  allowNull: false },
  dateObtention: { type: DataTypes.DATE,     allowNull: false },
  idAbsenceLiee: { type: DataTypes.INTEGER,  allowNull: true  },
  commentaire:   { type: DataTypes.STRING(255), allowNull: true  },
}, { timestamps: true });

module.exports = EmpPenaliteAbsence;
