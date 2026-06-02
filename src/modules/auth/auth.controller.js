'use strict';

const authService         = require('./auth.service');
const { sendSuccess, sendCreated } = require('../../utils/response');
const asyncWrapper        = require('../../utils/asyncWrapper');

const register = asyncWrapper(async (req, res) => {
  const user = await authService.register(req.body);
  return sendCreated(res, user, 'Compte créé avec succès');
});

const login = asyncWrapper(async (req, res) => {
  const { email, motDePasse } = req.body;
  const result = await authService.login(email, motDePasse);
  return sendSuccess(res, result, 'Connexion réussie');
});

const getMe = asyncWrapper(async (req, res) => {
  const user = await authService.getMe(req.user.id);
  return sendSuccess(res, user);
});

const getSubordonnees = asyncWrapper(async (req, res) => {
  const users = await authService.getSubordonnees(
    req.user.id,
    req.user.rang.niveau
  );
  return sendSuccess(res, users);
});

const listeRangs = asyncWrapper(async (_req, res) => {
  const rangs = await authService.listeRangs();
  return sendSuccess(res, rangs);
});

const listePostes = asyncWrapper(async (_req, res) => {
  const postes = await authService.listePostes();
  return sendSuccess(res, postes);
});

module.exports = { register, login, getMe, getSubordonnees, listeRangs, listePostes };