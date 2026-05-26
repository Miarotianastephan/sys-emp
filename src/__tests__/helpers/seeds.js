'use strict';

const bcrypt = require('bcryptjs');
const { User, Rang, ConfigAbsence, ConfigBonusPenalite } = require('../../database/models');

const TEST_PASSWORD      = 'Test1234!';
const BCRYPT_ROUNDS      = 10; // fast for tests

const TEST_USERS = [
  { email: 'admin@test.mg',   nom: 'AdminTest',   prenom: 'Un',  niveau: 1, managerEmail: null },
  { email: 'manager@test.mg', nom: 'ManagerTest',  prenom: 'Un', niveau: 2, managerEmail: 'admin@test.mg' },
  { email: 'employe@test.mg', nom: 'EmployeTest',  prenom: 'Un', niveau: 3, managerEmail: 'manager@test.mg' },
];

// ── Bonus configs seeded for tests ────────────────────────────────────────────
const BONUS_CONFIGS = [
  { type: 'BONUS',    categorie: 'ASSIDUITE', libelle: 'Bonus assiduité test',      valeur: 50000, seuil: null, estPourcentage: false, estActif: true },
  { type: 'BONUS',    categorie: 'TACHE',     libelle: 'Bonus performance test',    valeur: 30000, seuil: null, estPourcentage: false, estActif: true },
  { type: 'PENALITE', categorie: 'RETARD',    libelle: 'Pénalité retard test',      valeur:  5000, seuil: 3,   estPourcentage: false, estActif: true },
  { type: 'PENALITE', categorie: 'ABSENCE',   libelle: 'Pénalité absence test',     valeur: 10000, seuil: 0.5, estPourcentage: false, estActif: true },
];

async function ensureTestUsersExist() {
  // 1. Resolve rang IDs
  const rangs = await Rang.findAll({ attributes: ['id', 'niveau'] });
  const rangMap = {};
  for (const r of rangs) rangMap[r.niveau] = r.id;

  if (!rangMap[1] || !rangMap[2] || !rangMap[3]) {
    throw new Error('ensureTestUsersExist: rangs 1/2/3 not found in DB — run db:seed first');
  }

  // 2. Check config_absence exists
  const configAbsences = await ConfigAbsence.count();
  if (configAbsences === 0) {
    throw new Error('ensureTestUsersExist: config_absence is empty — run db:seed first');
  }

  // 3. Create test users in dependency order
  const hash = await bcrypt.hash(TEST_PASSWORD, BCRYPT_ROUNDS);
  const created = {};

  for (const def of TEST_USERS) {
    let user = await User.findOne({ where: { email: def.email } });
    if (!user) {
      const managerId = def.managerEmail ? created[def.managerEmail]?.id ?? null : null;
      user = await User.create({
        nom:          def.nom,
        prenom:       def.prenom,
        email:        def.email,
        motDePasse:   hash,
        dateEmbauche: '2024-01-01',
        idRang:       rangMap[def.niveau],
        idManager:    managerId,
        estActif:     true,
        salaire:      1000000, // 1 000 000 MGA — for percentage-based bonus calculations
      });
    }
    created[def.email] = user;
  }

  // Make sure manager linkage is correct even if users pre-existed
  const adminUser   = await User.findOne({ where: { email: 'admin@test.mg' } });
  const managerUser = await User.findOne({ where: { email: 'manager@test.mg' } });
  const employeUser = await User.findOne({ where: { email: 'employe@test.mg' } });

  if (managerUser.idManager !== adminUser.id) {
    await managerUser.update({ idManager: adminUser.id });
  }
  if (employeUser.idManager !== managerUser.id) {
    await employeUser.update({ idManager: managerUser.id });
  }

  // 4. Ensure bonus configs exist (one per type+categorie)
  for (const cfg of BONUS_CONFIGS) {
    await ConfigBonusPenalite.findOrCreate({
      where:    { type: cfg.type, categorie: cfg.categorie },
      defaults: cfg,
    });
  }

  return { adminUser, managerUser, employeUser };
}

module.exports = { ensureTestUsersExist };
