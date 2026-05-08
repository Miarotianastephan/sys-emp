'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('config_global', [
      {
        baremePointBonus: 75,
        pourcentageBonusParSalaire: 25.00,
        heureEntrer: '09:00:00',
        tolerenceRetard: 10,
        heureSortie: '18:00:00',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('config_global', null, {});
  },
};
