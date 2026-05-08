'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('rang', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      niveau: {
        type: Sequelize.TINYINT,
        allowNull: false,
        unique: true,
      },
      libelle: {
        type: Sequelize.STRING(60),
        allowNull: false,
      },
      description: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
    }, {
      charset: 'utf8mb4',
      comment: 'Niveaux hiérarchiques',
    });

    await queryInterface.createTable('poste', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      rolePredefini: {
        type: Sequelize.ENUM('Developpeur','Testeur','Marketing','Support','Cloud','Autre'),
        allowNull: false,
      },
      estActif: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    }, {
      charset: 'utf8mb4',
      comment: 'Postes et rôles professionnels',
    });

    await queryInterface.createTable('permission', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      code: {
        type: Sequelize.STRING(80),
        allowNull: false,
        unique: true,
      },
      description: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
    }, {
      charset: 'utf8mb4',
      comment: 'Permissions disponibles dans l application',
    });

    await queryInterface.createTable('user', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      nom: {
        type: Sequelize.STRING(80),
        allowNull: false,
      },
      prenom: {
        type: Sequelize.STRING(80),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(150),
        allowNull: false,
        unique: true,
      },
      motDePasse: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      telephone: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      dateNaissance: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      dateEmbauche: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      salaire: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
      },
      idPoste: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'poste',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      intitulePersonnalise: {
        type: Sequelize.STRING(120),
        allowNull: true,
      },
      idRang: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'rang',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      idManager: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'user',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      estActif: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    }, {
      charset: 'utf8mb4',
      comment: 'Utilisateurs — employés et managers',
    });

    await queryInterface.createTable('rang_permission', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      idRang: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'rang',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      idPermission: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'permission',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
    }, {
      charset: 'utf8mb4',
      comment: 'Permissions attribuées par rang',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('rang_permission');
    await queryInterface.dropTable('user');
    await queryInterface.dropTable('permission');
    await queryInterface.dropTable('poste');
    await queryInterface.dropTable('rang');
  },
};
