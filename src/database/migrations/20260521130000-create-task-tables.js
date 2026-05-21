'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('config_task', {
      id: {
        type:          Sequelize.INTEGER,
        allowNull:     false,
        autoIncrement: true,
        primaryKey:    true,
      },
      titre: {
        type:      Sequelize.STRING(150),
        allowNull: false,
      },
      description: {
        type:      Sequelize.TEXT,
        allowNull: true,
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
    }, {
      charset: 'utf8mb4',
      comment: 'Templates de tâches réutilisables',
    });

    await queryInterface.createTable('emp_task', {
      id: {
        type:          Sequelize.INTEGER,
        allowNull:     false,
        autoIncrement: true,
        primaryKey:    true,
      },
      idConfigTask: {
        type:       Sequelize.INTEGER,
        allowNull:  true,
        references: { model: 'config_task', key: 'id' },
        onUpdate:   'CASCADE',
        onDelete:   'SET NULL',
      },
      idUserAssigne: {
        type:       Sequelize.INTEGER,
        allowNull:  false,
        references: { model: 'user', key: 'id' },
        onUpdate:   'CASCADE',
        onDelete:   'CASCADE',
      },
      idUserCreateur: {
        type:       Sequelize.INTEGER,
        allowNull:  false,
        references: { model: 'user', key: 'id' },
        onUpdate:   'CASCADE',
        onDelete:   'CASCADE',
      },
      titre: {
        type:      Sequelize.STRING(150),
        allowNull: false,
      },
      description: {
        type:      Sequelize.TEXT,
        allowNull: true,
      },
      dateDebut: {
        type:      Sequelize.DATEONLY,
        allowNull: false,
      },
      dateLimite: {
        type:      Sequelize.DATEONLY,
        allowNull: false,
      },
      dateCompletion: {
        type:      Sequelize.DATEONLY,
        allowNull: true,
      },
      poids: {
        type:         Sequelize.INTEGER,
        allowNull:    false,
        defaultValue: 1,
      },
      statut: {
        type:         Sequelize.ENUM('EN_COURS', 'TERMINE', 'EN_RETARD'),
        allowNull:    false,
        defaultValue: 'EN_COURS',
      },
      priorite: {
        type:         Sequelize.ENUM('BASSE', 'NORMALE', 'HAUTE'),
        allowNull:    false,
        defaultValue: 'NORMALE',
      },
      commentaire: {
        type:      Sequelize.TEXT,
        allowNull: true,
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
    }, {
      charset: 'utf8mb4',
      comment: 'Tâches assignées aux employés',
    });

    await queryInterface.addIndex('emp_task', ['idUserAssigne'], { name: 'emp_task_id_user_assigne' });
    await queryInterface.addIndex('emp_task', ['statut'],        { name: 'emp_task_statut'          });
    await queryInterface.addIndex('emp_task', ['dateLimite'],    { name: 'emp_task_date_limite'     });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('emp_task');
    await queryInterface.dropTable('config_task');
  },
};
