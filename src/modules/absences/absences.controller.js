'use strict';

const absencesService = require('./absences.service');
const { sendSuccess, sendCreated } = require('../../utils/response');
const asyncWrapper = require('../../utils/asyncWrapper');

const creerDemande = asyncWrapper(async (req, res) => {
  const demande = await absencesService.creerDemande(req.user, req.body);
  return sendCreated(res, demande, 'Demande enregistrée. Le manager sera notifié.');
});

const mesDemandes = asyncWrapper(async (req, res) => {
  const { statut, mois, annee } = req.query;
  const demandes = await absencesService.recupererMesDemandes(
    req.user.id,
    { statut, mois, annee }
  );
  return sendSuccess(res, demandes);
});

const equipe = asyncWrapper(async (req, res) => {
  const { statut, mois, annee } = req.query;
  const demandes = await absencesService.recupererDemandesEquipe(
    req.user,
    { statut, mois, annee }
  );
  return sendSuccess(res, demandes);
});

const configurations = asyncWrapper(async (req, res) => {
  const config = await absencesService.recupererConfigurations();
  return sendSuccess(res, config);
});

const validerDemande = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const result = await absencesService.validerDemande(
    req.user,
    parseInt(id, 10),
    req.body
  );
  return sendSuccess(res, result, 'Demande mise à jour');
});

module.exports = {
  creerDemande,
  mesDemandes,
  equipe,
  configurations,
  validerDemande,
};
