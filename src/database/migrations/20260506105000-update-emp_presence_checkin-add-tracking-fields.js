'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('emp_presence_checkin', 'ipAddress', {
      type: Sequelize.STRING(45),
      allowNull: true,
      defaultValue: null,
    });

    await queryInterface.addColumn('emp_presence_checkin', 'ssidReseau', {
      type: Sequelize.STRING(100),
      allowNull: true,
      defaultValue: null,
    });

    await queryInterface.addColumn('emp_presence_checkin', 'sourceDevice', {
      type: Sequelize.STRING(100),
      allowNull: true,
      defaultValue: null,
    });

    await queryInterface.addColumn('emp_presence_checkin', 'latitude', {
      type: Sequelize.DECIMAL(9, 6),
      allowNull: true,
      defaultValue: null,
    });

    await queryInterface.addColumn('emp_presence_checkin', 'longitude', {
      type: Sequelize.DECIMAL(9, 6),
      allowNull: true,
      defaultValue: null,
    });

    await queryInterface.addColumn('emp_presence_checkin', 'estRetard', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    await queryInterface.addColumn('emp_presence_checkin', 'minutesRetard', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });

    await queryInterface.addColumn('emp_presence_checkin', 'estAbsent', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    await queryInterface.addColumn('emp_presence_checkin', 'statut', {
      type: Sequelize.ENUM('present', 'absent', 'retard', 'conge', 'ferie'),
      allowNull: false,
      defaultValue: 'present',
    });

    await queryInterface.addColumn('emp_presence_checkin', 'justification', {
      type: Sequelize.TEXT,
      allowNull: true,
      defaultValue: null,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('emp_presence_checkin', 'justification');
    await queryInterface.removeColumn('emp_presence_checkin', 'statut');
    await queryInterface.removeColumn('emp_presence_checkin', 'estAbsent');
    await queryInterface.removeColumn('emp_presence_checkin', 'minutesRetard');
    await queryInterface.removeColumn('emp_presence_checkin', 'estRetard');
    await queryInterface.removeColumn('emp_presence_checkin', 'longitude');
    await queryInterface.removeColumn('emp_presence_checkin', 'latitude');
    await queryInterface.removeColumn('emp_presence_checkin', 'sourceDevice');
    await queryInterface.removeColumn('emp_presence_checkin', 'ssidReseau');
    await queryInterface.removeColumn('emp_presence_checkin', 'ipAddress');
  },
};
