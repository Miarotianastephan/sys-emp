'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('rang', [
      {
        niveau: 1,
        libelle: 'Manager général',
        description: 'Accès total — voit tout y compris les salaires',
      },
      {
        niveau: 2,
        libelle: 'Manager équipe',
        description: 'Voit et gère uniquement les membres de son équipe',
      },
      {
        niveau: 3,
        libelle: 'Employé',
        description: 'Accès à ses propres données uniquement',
      },
    ], {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('rang', null, {});
  },
};
