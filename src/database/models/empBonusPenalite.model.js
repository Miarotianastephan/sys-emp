'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');

const EmpBonusPenalite = sequelize.define('emp_bonus_penalite', {
  id:             { type: DataTypes.INTEGER,                                        primaryKey: true, autoIncrement: true },
  idUser:         { type: DataTypes.INTEGER,                                        allowNull: false },
  idConfig:       { type: DataTypes.INTEGER,                                        allowNull: true  },
  type:           { type: DataTypes.ENUM('BONUS', 'PENALITE'),                      allowNull: false },
  categorie:      { type: DataTypes.ENUM('TACHE', 'ASSIDUITE', 'RETARD', 'ABSENCE'), allowNull: false },
  libelle:        { type: DataTypes.STRING(150),                                    allowNull: false },
  montant:        { type: DataTypes.DECIMAL(10, 2),                                 allowNull: false },
  mois:           { type: DataTypes.INTEGER,                                        allowNull: false, validate: { min: 1, max: 12 } },
  annee:          { type: DataTypes.INTEGER,                                        allowNull: false },
  estManuel:      { type: DataTypes.BOOLEAN,                                        defaultValue: false },
  commentaire:    { type: DataTypes.TEXT,                                           allowNull: true  },
  idUserCreateur: { type: DataTypes.INTEGER,                                        allowNull: false },
}, { timestamps: true, tableName: 'emp_bonus_penalite' });

module.exports = EmpBonusPenalite;
