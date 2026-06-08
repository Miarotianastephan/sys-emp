'use strict';

const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { Op }   = require('sequelize');
const { User, Rang, Permission, Poste } = require('../../database/models');
const ApiError = require('../../utils/ApiError');
const env      = require('../../config/env');

// ── Inscription ────────────────────────────────────────────
async function register(data) {
  const existing = await User.findOne({ where: { email: data.email } });
  if (existing) throw ApiError.conflict('Cet email est déjà utilisé');

  const rang = await Rang.findByPk(data.idRang);
  if (!rang) throw ApiError.badRequest('Rang introuvable');

  const hash = await bcrypt.hash(data.motDePasse, env.bcryptRounds);

  const user = await User.create({ ...data, motDePasse: hash });

  const { motDePasse, ...userSafe } = user.toJSON();
  return userSafe;
}

// ── Connexion ──────────────────────────────────────────────
async function login(email, motDePasse) {
  const user = await User.findOne({
    where: { email, estActif: true },
    include: [
      {
        model: Rang,
        as: 'rang',
        include: [{ model: Permission, as: 'permissions' }],
      },
      { model: Poste, as: 'poste' },
    ],
  });

  if (!user) throw ApiError.unauthorized('Email ou mot de passe incorrect');

  const isValid = await bcrypt.compare(motDePasse, user.motDePasse);
  if (!isValid) throw ApiError.unauthorized('Email ou mot de passe incorrect');

  const permissions = user.rang.permissions.map((p) => p.code);

  const token = jwt.sign(
    { id: user.id, idRang: user.idRang, niveau: user.rang.niveau },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn }
  );

  return {
    token,
    user: {
      id:          user.id,
      nom:         user.nom,
      prenom:      user.prenom,
      email:       user.email,
      rang: {
        id:      user.rang.id,
        niveau:  user.rang.niveau,
        libelle: user.rang.libelle,
      },
      poste:       user.poste ?? null,
      permissions,
    },
  };
}

// ── Profil connecté ────────────────────────────────────────
async function getMe(userId) {
  const user = await User.findOne({
    where: { id: userId, estActif: true },
    attributes: { exclude: ['motDePasse'] },
    include: [
      {
        model: Rang,
        as: 'rang',
        include: [{ model: Permission, as: 'permissions' }],
      },
      { model: Poste,  as: 'poste'    },
      {
        model: User,
        as:    'manager',
        attributes: ['id', 'nom', 'prenom', 'email'],
      },
    ],
  });

  if (!user) throw ApiError.notFound('Utilisateur introuvable');

  const userData    = user.toJSON();
  userData.permissions = user.rang.permissions.map((p) => p.code);
  return userData;
}

async function getSubordonnees(callerId, niveauCaller) {
  const commonIncludes = [
    {
      model:      Rang,
      as:         'rang',
      attributes: ['id', 'niveau', 'libelle'],
    },
    {
      model:      Poste,
      as:         'poste',
      attributes: ['id', 'rolePredefini', 'estActif'],
    },
    {
      model:      User,
      as:         'manager',
      attributes: ['id', 'nom', 'prenom', 'email'],
    },
  ];

  const commonAttributes = {
    exclude: ['motDePasse'],
  };

  // Admin: sees every active user
  if (niveauCaller === 1) {
    return User.findAll({
      where: {
        estActif: true,
      },
      attributes: commonAttributes,
      include:    commonIncludes,
      order:      [['nom', 'ASC'], ['prenom', 'ASC']],
    });
  }

  // Manager: sees all n-1 users 
  return User.findAll({
    where: {
      [Op.or]: [
        { idRang: { [Op.gt]: 2 } }, // all niveau 3 users
        { idManager: callerId },
        { id: callerId }, // include self in list
      ],
      estActif:  true,
    },
    attributes: commonAttributes,
    include:    commonIncludes,
    order:      [['nom', 'ASC'], ['prenom', 'ASC']],
  });
}

// ── Référentiels publics ───────────────────────────────────
async function listeRangs() {
  return Rang.findAll({
    attributes: ['id', 'niveau', 'libelle', 'description'],
    order: [['niveau', 'ASC']],
  });
}

async function listePostes() {
  return Poste.findAll({
    where:      { estActif: true },
    attributes: ['id', 'rolePredefini'],
    order:      [['rolePredefini', 'ASC']],
  });
}

// ── Validation du mot de passe ────────────────────────────
async function validatePassword(userId, motDePasse) {
  const user = await User.findByPk(userId, {
    attributes: ['id', 'motDePasse', 'estActif'],
  });

  if (!user || !user.estActif) {
    throw ApiError.notFound('Utilisateur introuvable');
  }

  const isValid = await bcrypt.compare(motDePasse, user.motDePasse);
  return isValid;
}

module.exports = { register, login, getMe, getSubordonnees, listeRangs, listePostes, validatePassword };