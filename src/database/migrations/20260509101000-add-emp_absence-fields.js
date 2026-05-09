'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('emp_absence', 'nombreJours', {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
    });

    await queryInterface.addColumn('emp_absence', 'commentaireValidateur', {
      type: Sequelize.TEXT,
      allowNull: true,
      defaultValue: null,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('emp_absence', 'commentaireValidateur');
    await queryInterface.removeColumn('emp_absence', 'nombreJours');
  },
};
