'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('emp_presence_checkin', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      idUser: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'user',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      debutCheckin: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      finCheckin: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      dureeTravail: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      estValide: {
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
      comment: 'Historique des présences (check-in / check-out)',
    });

    await queryInterface.addIndex('emp_presence_checkin', ['idUser']);
    await queryInterface.addIndex('emp_presence_checkin', ['debutCheckin']);

    await queryInterface.createTable('config_global', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      baremePointBonus: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 75,
      },
      pourcentageBonusParSalaire: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 25.00,
      },
      heureEntrer: {
        type: Sequelize.TIME,
        allowNull: false,
        defaultValue: '09:00:00',
      },
      tolerenceRetard: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 10,
      },
      heureSortie: {
        type: Sequelize.TIME,
        allowNull: false,
        defaultValue: '18:10:00',
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
      comment: 'Configuration globale (une seule ligne)',
    });

    await queryInterface.createTable('config_absence', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      typeAbsence: {
        type: Sequelize.ENUM('OFF', 'CONGE'),
        allowNull: false,
      },
      joursAutorises: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      joursAvantAutorisation: {
        type: Sequelize.INTEGER,
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
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    }, {
      charset: 'utf8mb4',
      comment: 'Configuration des types d absences',
    });

    await queryInterface.addConstraint('config_absence', {
      fields: ['typeAbsence'],
      type: 'unique',
      name: 'uq_type_absence',
    });

    await queryInterface.createTable('emp_absence', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      idConfigAbsence: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'config_absence',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      idUserDemandeur: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'user',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      idUserValidateur: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'user',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      dateDemande: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      dateDebutAbsence: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      dateFinAbsence: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      typeJournee: {
        type: Sequelize.ENUM('JOURNEE', 'MATIN', 'APRES_MIDI'),
        allowNull: false,
        defaultValue: 'JOURNEE',
      },
      statut: {
        type: Sequelize.ENUM('ATTENTE', 'VALIDE', 'REFUSE'),
        allowNull: false,
        defaultValue: 'ATTENTE',
      },
      priorite: {
        type: Sequelize.ENUM('BASSE', 'NORMALE', 'HAUTE'),
        allowNull: false,
        defaultValue: 'NORMALE',
      },
      motif: {
        type: Sequelize.STRING(255),
        allowNull: true,
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
      comment: 'Demandes d absences des employés',
    });

    await queryInterface.addIndex('emp_absence', ['idUserDemandeur']);
    await queryInterface.addIndex('emp_absence', ['statut']);
    await queryInterface.addIndex('emp_absence', ['dateDebutAbsence', 'dateFinAbsence']);

    await queryInterface.createTable('type_penalite_absence', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      code: {
        type: Sequelize.ENUM('P1', 'P2', 'P3', 'P4'),
        allowNull: false,
      },
      titre: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      malus: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      description: {
        type: Sequelize.STRING(255),
        allowNull: true,
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
      comment: 'Types de pénalités liées aux absences',
    });

    await queryInterface.addConstraint('type_penalite_absence', {
      fields: ['code'],
      type: 'unique',
      name: 'uq_penalite_code',
    });

    await queryInterface.createTable('emp_penalite_absence', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      idUser: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'user',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      idTypePenalite: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'type_penalite_absence',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      dateObtention: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      idAbsenceLiee: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'emp_absence',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      commentaire: {
        type: Sequelize.STRING(255),
        allowNull: true,
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
      comment: 'Pénalités appliquées aux employés',
    });

    await queryInterface.addIndex('emp_penalite_absence', ['idUser']);
    await queryInterface.addIndex('emp_penalite_absence', ['dateObtention']);

    await queryInterface.createTable('config_ferier', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      dateFerie: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      description: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      estRecurrent: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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
      comment: 'Configuration des jours fériés',
    });

    await queryInterface.addConstraint('config_ferier', {
      fields: ['dateFerie'],
      type: 'unique',
      name: 'uq_date_ferie',
    });

    await queryInterface.createTable('confirm_heure_supp', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      idUser: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'user',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      idPresenceCheckin: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'emp_presence_checkin',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      heureSortieReelle: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      heureSortieTheorique: {
        type: Sequelize.TIME,
        allowNull: false,
      },
      dureeSupp: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      estValide: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      idUserValidateur: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'user',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      motifSupp: {
        type: Sequelize.STRING(255),
        allowNull: true,
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
      comment: 'Validation des heures supplémentaires',
    });

    await queryInterface.addIndex('confirm_heure_supp', ['idUser']);

    await queryInterface.createTable('config_emp_point', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      typePoint: {
        type: Sequelize.ENUM('BONUS', 'MALUS'),
        allowNull: false,
      },
      code: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      valeur: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      estFixe: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      estActif: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      dateCreation: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      dateArchivage: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      description: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
    }, {
      charset: 'utf8mb4',
      comment: 'Configuration des points (bonus / malus)',
      timestamps: false,
    });

    await queryInterface.addConstraint('config_emp_point', {
      fields: ['code'],
      type: 'unique',
      name: 'uq_point_code',
    });

    await queryInterface.createTable('emp_point', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      idUser: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'user',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      idConfigEmpPoint: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'config_emp_point',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      points: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      dateAttribution: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      dateFinSemaine: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      source: {
        type: Sequelize.ENUM('PRESENCE', 'ABSENCE', 'PENALITE', 'MANUEL'),
        allowNull: false,
      },
      idSource: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      commentaire: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    }, {
      charset: 'utf8mb4',
      comment: 'Historique des points des employés',
      timestamps: false,
    });

    await queryInterface.addIndex('emp_point', ['idUser']);
    await queryInterface.addIndex('emp_point', ['dateFinSemaine']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('emp_point');
    await queryInterface.dropTable('config_emp_point');
    await queryInterface.dropTable('confirm_heure_supp');
    await queryInterface.dropTable('config_ferier');
    await queryInterface.dropTable('emp_penalite_absence');
    await queryInterface.dropTable('type_penalite_absence');
    await queryInterface.dropTable('emp_absence');
    await queryInterface.dropTable('config_absence');
    await queryInterface.dropTable('config_global');
    await queryInterface.dropTable('emp_presence_checkin');
  },
};
