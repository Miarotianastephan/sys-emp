'use strict';

const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { User, Rang, Permission, Poste } = require('../../database/models');
const ApiError = require('../../utils/ApiError');
const env      = require('../../config/env');

// ── Inscription ────────────────────────────────────────────
async function register(data) {
  // 1. Vérifier si l'email est déjà pris
  const existing = await User.findOne({ where: { email: data.email } });
  if (existing) throw ApiError.conflict('Cet email est déjà utilisé');

  // 2. Vérifier que le rang existe
  const rang = await Rang.findByPk(data.idRang);
  if (!rang) throw ApiError.badRequest('Rang introuvable');

  // 3. Hasher le mot de passe
  const hash = await bcrypt.hash(data.motDePasse, env.bcryptRounds);

  // 4. Créer l'utilisateur
  const user = await User.create({ ...data, motDePasse: hash });

  // 5. Retourner sans le mot de passe
  const { motDePasse, ...userSafe } = user.toJSON();
  return userSafe;
}

// ── Connexion ──────────────────────────────────────────────
async function login(email, motDePasse) {
  // 1. Trouver l'utilisateur avec son rang et ses permissions
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

  // 2. Vérifier le mot de passe
  const isValid = await bcrypt.compare(motDePasse, user.motDePasse);
  if (!isValid) throw ApiError.unauthorized('Email ou mot de passe incorrect');

  // 3. Construire la liste des permissions
  const permissions = user.rang.permissions.map((p) => p.code);

  // 4. Générer le JWT
  const token = jwt.sign(
    { id: user.id, idRang: user.idRang, niveau: user.rang.niveau },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn }
  );

  // 5. Réponse propre (sans motDePasse)
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

module.exports = { register, login, getMe };