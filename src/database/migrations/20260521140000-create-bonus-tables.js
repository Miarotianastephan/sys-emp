'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('config_bonus_penalite', {
      id: {
        type:          Sequelize.INTEGER,
        allowNull:     false,
        autoIncrement: true,
        primaryKey:    true,
      },
      type: {
        type:      Sequelize.ENUM('BONUS', 'PENALITE'),
        allowNull: false,
      },
      categorie: {
        type:      Sequelize.ENUM('TACHE', 'ASSIDUITE', 'RETARD', 'ABSENCE'),
        allowNull: false,
      },
      libelle: {
        type:      Sequelize.STRING(150),
        allowNull: false,
      },
      valeur: {
        type:      Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      seuil: {
        type:      Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      estPourcentage: {
        type:         Sequelize.BOOLEAN,
        allowNull:    false,
        defaultValue: false,
      },
      estActif: {
        type:         Sequelize.BOOLEAN,
        allowNull:    false,
        defaultValue: true,
      },
      createdAt: {
        type:         Sequelize.DATE,
        allowNull:    false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type:         Sequelize.DATE,
        allowNull:    false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    }, { charset: 'utf8mb4', comment: 'Règles de configuration des bonus et pénalités' });

    await queryInterface.createTable('emp_bonus_penalite', {
      id: {
        type:          Sequelize.INTEGER,
        allowNull:     false,
        autoIncrement: true,
        primaryKey:    true,
      },
      idUser: {
        type:       Sequelize.INTEGER,
        allowNull:  false,
        references: { model: 'user', key: 'id' },
        onUpdate:   'CASCADE',
        onDelete:   'CASCADE',
      },
      idConfig: {
        type:       Sequelize.INTEGER,
        allowNull:  true,
        references: { model: 'config_bonus_penalite', key: 'id' },
        onUpdate:   'CASCADE',
        onDelete:   'SET NULL',
      },
      type: {
        type:      Sequelize.ENUM('BONUS', 'PENALITE'),
        allowNull: false,
      },
      categorie: {
        type:      Sequelize.ENUM('TACHE', 'ASSIDUITE', 'RETARD', 'ABSENCE'),
        allowNull: false,
      },
      libelle: {
        type:      Sequelize.STRING(150),
        allowNull: false,
      },
      montant: {
        type:      Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      mois: {
        type:      Sequelize.INTEGER,
        allowNull: false,
      },
      annee: {
        type:      Sequelize.INTEGER,
        allowNull: false,
      },
      estManuel: {
        type:         Sequelize.BOOLEAN,
        allowNull:    false,
        defaultValue: false,
      },
      commentaire: {
        type:      Sequelize.TEXT,
        allowNull: true,
      },
      idUserCreateur: {
        type:       Sequelize.INTEGER,
        allowNull:  false,
        references: { model: 'user', key: 'id' },
        onUpdate:   'CASCADE',
        onDelete:   'CASCADE',
      },
      createdAt: {
        type:         Sequelize.DATE,
        allowNull:    false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type:         Sequelize.DATE,
        allowNull:    false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    }, { charset: 'utf8mb4', comment: 'Bonus et pénalités individuels des employés' });

    // Unique constraint: prevents duplicate automatic entries per (user, config, month, year).
    // NULLs in idConfig (manual entries) are treated as distinct by MySQL, so they bypass this.
    await queryInterface.addIndex('emp_bonus_penalite', ['idUser', 'idConfig', 'mois', 'annee'], {
      unique: true,
      name:   'emp_bonus_penalite_unique_auto',
    });

    await queryInterface.addIndex('emp_bonus_penalite', ['idUser', 'mois', 'annee'], {
      name: 'emp_bonus_penalite_user_month',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('emp_bonus_penalite');
    await queryInterface.dropTable('config_bonus_penalite');
  },
};
