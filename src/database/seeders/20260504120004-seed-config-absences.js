'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('config_absence', [
      {
        typeAbsence: 'OFF',
        joursAutorises: 4,
        joursAvantAutorisation: 3,
        estActif: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        typeAbsence: 'CONGE',
        joursAutorises: 2.5,  // Note: MySQL DECIMAL, mais INTEGER dans migration ? Attends, dans migration c'est INTEGER
        joursAvantAutorisation: 6,
        estActif: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('config_absence', null, {});
  },
};
