'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('permission', [
      { code: 'VOIR_SALAIRES',           description: 'Consulter les salaires de tous les employés' },
      { code: 'VOIR_EQUIPE_COMPLETE',    description: 'Voir tous les utilisateurs de toutes les équipes' },
      { code: 'VOIR_EQUIPE_PROPRE',      description: 'Voir uniquement les membres sous sa direction' },
      { code: 'VALIDER_CONGE',           description: 'Approuver ou refuser les demandes de congé/off' },
      { code: 'CREER_TACHE',             description: 'Créer et assigner des tâches' },
      { code: 'GERER_BONUS_PENALITE',    description: 'Attribuer des bonus ou des pénalités' },
      { code: 'GERER_UTILISATEURS',      description: 'Créer, modifier, désactiver des comptes' },
      { code: 'VOIR_STATS_GLOBALES',     description: 'Accéder au dashboard global de performance' },
      { code: 'POINTER_PRESENCE',        description: 'Enregistrer sa propre entrée/sortie' },
      { code: 'SOUMETTRE_DEMANDE',       description: 'Soumettre une demande de congé ou d off' },
      { code: 'VOIR_SES_DONNEES',        description: 'Consulter son propre profil et statistiques' },
    ], {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('permission', null, {});
  },
};
