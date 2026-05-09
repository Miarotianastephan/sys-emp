'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');

const Notification = sequelize.define('notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  idUser: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('INFO', 'ALERT', 'ACTION'),
    allowNull: false,
    defaultValue: 'INFO',
  },
  title: {
    type: DataTypes.STRING(120),
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  payload: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  isLu: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}, {
  timestamps: true,
});

module.exports = Notification;
