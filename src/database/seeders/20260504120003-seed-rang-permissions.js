'use strict';

module.exports = {
  async up(queryInterface) {
    const [permissions] = await queryInterface.sequelize.query(
      `SELECT id, code FROM permission WHERE code IN (
        'VOIR_SALAIRES',
        'VOIR_EQUIPE_COMPLETE',
        'VOIR_EQUIPE_PROPRE',
        'VALIDER_CONGE',
        'CREER_TACHE',
        'GERER_BONUS_PENALITE',
        'GERER_UTILISATEURS',
        'VOIR_STATS_GLOBALES',
        'POINTER_PRESENCE',
        'SOUMETTRE_DEMANDE',
        'VOIR_SES_DONNEES'
      )`
    );

    const permissionMap = permissions.reduce((acc, permission) => {
      acc[permission.code] = permission.id;
      return acc;
    }, {});

    const rows = [
      ...permissions.map((permission) => ({ idRang: 1, idPermission: permission.id })),
      ...['VOIR_EQUIPE_PROPRE', 'VALIDER_CONGE', 'CREER_TACHE', 'GERER_BONUS_PENALITE', 'POINTER_PRESENCE', 'SOUMETTRE_DEMANDE', 'VOIR_SES_DONNEES'].map((code) => ({
        idRang: 2,
        idPermission: permissionMap[code],
      })),
      ...['POINTER_PRESENCE', 'SOUMETTRE_DEMANDE', 'VOIR_SES_DONNEES'].map((code) => ({
        idRang: 3,
        idPermission: permissionMap[code],
      })),
    ];

    await queryInterface.bulkInsert('rang_permission', rows, {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('rang_permission', null, {});
  },
};
