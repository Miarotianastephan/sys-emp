'use strict';

const { date } = require('joi');
const { ConfigFerier } = require('../../database/models');
const ApiError = require('../../utils/ApiError');

async function createFerier(data){
    const existing = await ConfigFerier.findOne({ where: { dateFerie: data.dateFerie } });
    if (existing) {
        throw ApiError.conflict(`Un jour férié existe déjà pour la date ${data.dateFerie}`);
    }
    return await ConfigFerier.create({
        dateFerie: data.dateFerie,
        description: data.description,
        estRecurrent: data.estRecurrent ?? false,
    });
}

async function updateFerier(id, data){
    const ferier = await ConfigFerier.findByPk(id);
    if (!ferier) {
        throw ApiError.notFound(`Jour férié avec ID ${id} introuvable`);
    }
    if (data.dateFerie && data.dateFerie !== ferier.dateFerie) {
        const doublon = await ConfigFerier.findOne({
            where: {
                dateFerie: data.dateFerie,
                id: { [Op.ne]: id },
            },
        });
        if (doublon) {
            throw ApiError.conflict(
                `Un jour férié existe déjà pour la date ${data.dateFerie}`
            );
        }
    }
    await ferier.update(data);
    return ferier;
}

async function removeFerier(id){
    const ferier = await ConfigFerier.findByPk(id);
    if (!ferier) {
        throw ApiError.notFound(`Jour férié avec ID ${id} introuvable`);
    }
    await ferier.destroy();
    return { message: `Jour férié "${ferier.description}" supprimé` };
}

async function listFerier(query = {}) {
    const where = {};

    // Filtrer par année si précisée
    if (query.annee) {
        where.dateFerie = {
        [Op.between]: [
            `${query.annee}-01-01`,
            `${query.annee}-12-31`,
        ],
        };
    }

    const feriers = await ConfigFerier.findAll({
        where,
        order: [['dateFerie', 'ASC']],
    });

    return feriers;
}

async function getFerierById(id) {
    const ferier = await ConfigFerier.findByPk(id);
    if (!ferier) {
        throw ApiError.notFound(`Jour férié avec ID ${id} introuvable`);
    }
    return ferier;
}

async function estJourFerie(date) {
  const dateStr = date instanceof Date
    ? date.toISOString().split('T')[0]
    : date;

  const ferier = await ConfigFerier.findOne({
    where: { dateFerie: dateStr },
  });

  return !!ferier;
}

module.exports = {
    createFerier,
    updateFerier,
    removeFerier,
    listFerier,
    getFerierById,
    estJourFerie,
}