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

const validatePassword = asyncWrapper(async (req, res) => {
  const { motDePasse } = req.body;
  const isValid = await authService.validatePassword(req.user.id, motDePasse);

  if (!isValid) {
    res.status(400).json({ success: false, error: 'Mot de passe invalide' });
  }

  return sendSuccess(res, { message: 'MDP Validé' });
});


module.exports = { register, login, getMe, validatePassword };