'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('config_absence', 'joursAutorises', {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('config_absence', 'joursAutorises', {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
  },
};
