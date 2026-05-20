'use strict';

const ferierService              = require('./ferier.service');
const { sendSuccess, sendCreated } = require('../../utils/response');
const asyncWrapper               = require('../../utils/asyncWrapper');

const createFerier = asyncWrapper(async (req, res) => {
    const ferier = await ferierService.createFerier(req.body);
    return sendCreated(res, ferier, 'Jour férié créé avec succès');
});

const updateFerier = asyncWrapper(async (req, res) => {
    const ferier = await ferierService.updateFerier(req.params.id, req.body);
    return sendSuccess(res, ferier, 'Jour férié mis à jour avec succès');
});

const removeFerier = asyncWrapper(async (req, res) => {
    const result = await ferierService.removeFerier(req.params.id);
    return sendSuccess(res, result, 'Jour férié supprimé avec succès');
});

const listFerier = asyncWrapper(async (req, res) => {
    const feriers = await ferierService.listFerier(req.query);
    return sendSuccess(res, feriers, 'Liste des jours fériés récupérée');
});

const getFerier = asyncWrapper(async (req, res) => {
    const ferier = await ferierService.getFerierById(req.params.id);
    return sendSuccess(res, ferier, 'Jour férié récupéré avec succès');
});

module.exports = {
    createFerier,
    updateFerier,
    removeFerier,
    listFerier,
    getFerier,
};
