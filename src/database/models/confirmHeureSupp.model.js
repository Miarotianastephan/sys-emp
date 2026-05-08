'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');

const ConfirmHeureSupp = sequelize.define('confirm_heure_supp', {
  id:                { type: DataTypes.INTEGER,  primaryKey: true, autoIncrement: true },
  idUser:            { type: DataTypes.INTEGER,  allowNull: false },
  idPresenceCheckin: { type: DataTypes.INTEGER,  allowNull: false },
  heureSortieReelle: { type: DataTypes.DATE,     allowNull: false },
  heureSortieTheorique:{ type: DataTypes.TIME,   allowNull: false },
  dureeSupp:         { type: DataTypes.INTEGER,  allowNull: true  },
  estValide:         { type: DataTypes.BOOLEAN,  defaultValue: false },
  idUserValidateur:  { type: DataTypes.INTEGER,  allowNull: true  },
  motifSupp:         { type: DataTypes.STRING(255), allowNull: true  },
}, { timestamps: true });

module.exports = ConfirmHeureSupp;
