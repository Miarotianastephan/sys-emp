'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');

const User = sequelize.define('user', {
  id:                    { type: DataTypes.INTEGER,      primaryKey: true, autoIncrement: true },
  nom:                   { type: DataTypes.STRING(80),   allowNull: false },
  prenom:                { type: DataTypes.STRING(80),   allowNull: false },
  email:                 { type: DataTypes.STRING(150),  allowNull: false, unique: true },
  motDePasse:            { type: DataTypes.STRING(255),  allowNull: false },
  telephone:             { type: DataTypes.STRING(20),   allowNull: true  },
  dateNaissance:         { type: DataTypes.DATEONLY,     allowNull: true  },
  dateEmbauche:          { type: DataTypes.DATEONLY,     allowNull: false },
  salaire:               { type: DataTypes.DECIMAL(12,2),allowNull: true  },
  idPoste:               { type: DataTypes.INTEGER,      allowNull: true  },
  intitulePersonnalise:  { type: DataTypes.STRING(120),  allowNull: true  },
  idRang:                { type: DataTypes.INTEGER,      allowNull: false },
  idManager:             { type: DataTypes.INTEGER,      allowNull: true  },
  estActif:              { type: DataTypes.BOOLEAN,      defaultValue: true },
}, { timestamps: true, createdAt: 'createdAt', updatedAt: 'updatedAt' });

module.exports = User;