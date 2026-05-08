'use strict';

const { sequelize } = require('../../config/db');

// Import de tous les modèles
const Rang                  = require('./rang.model');
const Permission            = require('./permission.model');
const RangPermission        = require('./rangPermission.model');
const Poste                 = require('./poste.model');
const User                  = require('./user.model');
const EmpPresenceCheckin    = require('./empPresenceCheckin.model');
const ConfigGlobal          = require('./configGlobal.model');
const ConfigAbsence         = require('./configAbsence.model');
const EmpAbsence            = require('./empAbsence.model');
const TypePenaliteAbsence   = require('./typePenaliteAbsence.model');
const EmpPenaliteAbsence    = require('./empPenaliteAbsence.model');
const ConfigFerier          = require('./configFerier.model');
const ConfirmHeureSupp      = require('./confirmHeureSupp.model');
const ConfigEmpPoint        = require('./configEmpPoint.model');
const EmpPoint              = require('./empPoint.model');

// ── Associations ───────────────────────────────────────────

// Rang ↔ Permission (Many-to-Many via RangPermission)
Rang.belongsToMany(Permission, {
  through:    RangPermission,
  foreignKey: 'idRang',
  otherKey:   'idPermission',
  as:         'permissions',
});
Permission.belongsToMany(Rang, {
  through:    RangPermission,
  foreignKey: 'idPermission',
  otherKey:   'idRang',
  as:         'rangs',
});

// User → Rang (Many-to-One)
User.belongsTo(Rang,  { foreignKey: 'idRang',  as: 'rang'  });
Rang.hasMany(User,    { foreignKey: 'idRang',  as: 'users' });

// User → Poste (Many-to-One)
User.belongsTo(Poste, { foreignKey: 'idPoste', as: 'poste' });
Poste.hasMany(User,   { foreignKey: 'idPoste', as: 'users' });

// User → User (auto-référence hiérarchie manager)
User.belongsTo(User,  { foreignKey: 'idManager', as: 'manager'    });
User.hasMany(User,    { foreignKey: 'idManager', as: 'sousEquipe' });

// ── Présence ───────────────────────────────────────────────

// User → EmpPresenceCheckin (One-to-Many)
User.hasMany(EmpPresenceCheckin, { foreignKey: 'idUser', as: 'presences' });
EmpPresenceCheckin.belongsTo(User, { foreignKey: 'idUser', as: 'user' });

// ── Heures supplémentaires ───────────────────────────────────

// User → ConfirmHeureSupp (One-to-Many)
User.hasMany(ConfirmHeureSupp, { foreignKey: 'idUser', as: 'heuresSuppDemandees' });
ConfirmHeureSupp.belongsTo(User, { foreignKey: 'idUser', as: 'user' });

// EmpPresenceCheckin → ConfirmHeureSupp (One-to-Many)
EmpPresenceCheckin.hasMany(ConfirmHeureSupp, { foreignKey: 'idPresenceCheckin', as: 'heuresSuppRaw' });
ConfirmHeureSupp.belongsTo(EmpPresenceCheckin, { foreignKey: 'idPresenceCheckin', as: 'presence' });

// User → ConfirmHeureSupp (validateur)
User.hasMany(ConfirmHeureSupp, { foreignKey: 'idUserValidateur', as: 'heuresSuppValidees' });
ConfirmHeureSupp.belongsTo(User, { foreignKey: 'idUserValidateur', as: 'validateur' });

// ── Absences ───────────────────────────────────────────────

// ConfigAbsence → EmpAbsence (One-to-Many)
ConfigAbsence.hasMany(EmpAbsence, { foreignKey: 'idConfigAbsence', as: 'absences' });
EmpAbsence.belongsTo(ConfigAbsence, { foreignKey: 'idConfigAbsence', as: 'configAbsence' });

// User (demandeur) → EmpAbsence (One-to-Many)
User.hasMany(EmpAbsence, { foreignKey: 'idUserDemandeur', as: 'absencesDemandees' });
EmpAbsence.belongsTo(User, { foreignKey: 'idUserDemandeur', as: 'demandeur' });

// User (validateur) → EmpAbsence (One-to-Many)
User.hasMany(EmpAbsence, { foreignKey: 'idUserValidateur', as: 'absencesValidees' });
EmpAbsence.belongsTo(User, { foreignKey: 'idUserValidateur', as: 'validateur' });

// ── Pénalités ───────────────────────────────────────────────

// TypePenaliteAbsence → EmpPenaliteAbsence (One-to-Many)
TypePenaliteAbsence.hasMany(EmpPenaliteAbsence, { foreignKey: 'idTypePenalite', as: 'penalites' });
EmpPenaliteAbsence.belongsTo(TypePenaliteAbsence, { foreignKey: 'idTypePenalite', as: 'typePenalite' });

// User → EmpPenaliteAbsence (One-to-Many)
User.hasMany(EmpPenaliteAbsence, { foreignKey: 'idUser', as: 'penalites' });
EmpPenaliteAbsence.belongsTo(User, { foreignKey: 'idUser', as: 'user' });

// EmpAbsence → EmpPenaliteAbsence (One-to-Many)
EmpAbsence.hasMany(EmpPenaliteAbsence, { foreignKey: 'idAbsenceLiee', as: 'penalitesLiees' });
EmpPenaliteAbsence.belongsTo(EmpAbsence, { foreignKey: 'idAbsenceLiee', as: 'absenceLiee' });

// ── Points ───────────────────────────────────────────────────

// ConfigEmpPoint → EmpPoint (One-to-Many)
ConfigEmpPoint.hasMany(EmpPoint, { foreignKey: 'idConfigEmpPoint', as: 'pointsGagnes' });
EmpPoint.belongsTo(ConfigEmpPoint, { foreignKey: 'idConfigEmpPoint', as: 'config' });

// User → EmpPoint (One-to-Many)
User.hasMany(EmpPoint, { foreignKey: 'idUser', as: 'points' });
EmpPoint.belongsTo(User, { foreignKey: 'idUser', as: 'user' });

module.exports = {
  sequelize,
  Rang,
  Permission,
  RangPermission,
  Poste,
  User,
  EmpPresenceCheckin,
  ConfigGlobal,
  ConfigAbsence,
  EmpAbsence,
  TypePenaliteAbsence,
  EmpPenaliteAbsence,
  ConfigFerier,
  ConfirmHeureSupp,
  ConfigEmpPoint,
  EmpPoint,
};