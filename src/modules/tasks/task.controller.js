'use strict';

const taskService              = require('./task.service');
const { sendSuccess, sendCreated } = require('../../utils/response');
const asyncWrapper             = require('../../utils/asyncWrapper');

const creer = asyncWrapper(async (req, res) => {
  const task = await taskService.create(req.user, req.body);
  return sendCreated(res, task, 'Tâche créée avec succès');
});

const modifier = asyncWrapper(async (req, res) => {
  const task = await taskService.update(req.user, parseInt(req.params.id, 10), req.body);
  return sendSuccess(res, task, 'Tâche mise à jour');
});

const completer = asyncWrapper(async (req, res) => {
  const result = await taskService.complete(req.user, parseInt(req.params.id, 10), req.body);
  return sendSuccess(res, result, 'Tâche marquée comme terminée');
});

const mesTaches = asyncWrapper(async (req, res) => {
  const tasks = await taskService.listForUser(req.user, req.query);
  return sendSuccess(res, tasks);
});

const equipe = asyncWrapper(async (req, res) => {
  const tasks = await taskService.listForManager(req.user, req.query);
  return sendSuccess(res, tasks);
});

const detail = asyncWrapper(async (req, res) => {
  const task = await taskService.getById(req.user, parseInt(req.params.id, 10));
  return sendSuccess(res, task);
});

const stats = asyncWrapper(async (req, res) => {
  const idUser = parseInt(req.params.idUser, 10);
  const summary = await taskService.getPerformanceSummary(req.user, idUser, req.query);
  return sendSuccess(res, summary);
});

module.exports = { creer, modifier, completer, mesTaches, equipe, detail, stats };
