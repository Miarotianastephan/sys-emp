-- ============================================================
--  GESTION DES UTILISATEURS
--  Application de gestion du personnel
--  MySQL 8.0+
-- ============================================================

-- ------------------------------------------------------------
--  1. RANG
--  Définit les 3 niveaux hiérarchiques de l'application.
--  Le niveau pilote les accès via RANG_PERMISSION.
-- ------------------------------------------------------------
CREATE TABLE rang (
  id          INT           NOT NULL AUTO_INCREMENT,
  niveau      TINYINT       NOT NULL COMMENT '1 = Manager général, 2 = Manager équipe, 3 = Employé',
  libelle     VARCHAR(60)   NOT NULL COMMENT 'Ex: Manager général, Manager équipe, Employé',
  description VARCHAR(255)      NULL,

  PRIMARY KEY (id),
  UNIQUE KEY uq_rang_niveau (niveau)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Niveaux hiérarchiques';


-- ------------------------------------------------------------
--  2. POSTE
--  Sépare le rôle prédéfini (enum fixe) de l'intitulé libre.
-- ------------------------------------------------------------
CREATE TABLE poste (
  id                    INT           NOT NULL AUTO_INCREMENT,
  rolePredefini         ENUM(
                          'Developpeur',
                          'Testeur',
                          'Marketing',
                          'Support',
                          'Cloud',
                          'Autre'
                        )             NOT NULL,
  estActif              BOOLEAN       NOT NULL DEFAULT TRUE,
  createdAt             DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Postes et rôles professionnels';


-- ------------------------------------------------------------
--  3. PERMISSION
--  Catalogue de toutes les actions contrôlées dans l'app.
--  Chaque fonctionnalité sensible a son propre code.
-- ------------------------------------------------------------
CREATE TABLE permission (
  id          INT           NOT NULL AUTO_INCREMENT,
  code        VARCHAR(80)   NOT NULL COMMENT 'Ex: VOIR_SALAIRES, VALIDER_CONGE, GERER_BONUS',
  description VARCHAR(255)      NULL,

  PRIMARY KEY (id),
  UNIQUE KEY uq_permission_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Permissions disponibles dans l application';


-- ------------------------------------------------------------
--  4. USER
--  Table centrale — employés et managers dans une seule table.
--  idManager (auto-référence) construit toute la hiérarchie :
--    Rang 1 → idManager IS NULL
--    Rang 2 → idManager pointe vers un rang 1
--    Rang 3 → idManager pointe vers un rang 2
-- ------------------------------------------------------------
CREATE TABLE user (
  id                    INT             NOT NULL AUTO_INCREMENT,
  nom                   VARCHAR(80)     NOT NULL,
  prenom                VARCHAR(80)     NOT NULL,
  email                 VARCHAR(150)    NOT NULL,
  motDePasse            VARCHAR(255)    NOT NULL COMMENT 'Hash bcrypt',
  telephone             VARCHAR(20)         NULL,
  dateNaissance         DATE                NULL,
  dateEmbauche          DATE            NOT NULL,
  salaire               DECIMAL(12, 2)      NULL COMMENT 'Visible rang 1 uniquement via permission',

  idPoste               INT                 NULL,
  intitulePersonnalise  VARCHAR(120)        NULL COMMENT 'Ex: Lead Frontend React, Responsable QA Mobile',
  idRang                INT             NOT NULL,
  idManager             INT                 NULL COMMENT 'NULL si rang 1, sinon FK vers user.id',

  estActif              BOOLEAN         NOT NULL DEFAULT TRUE,
  createdAt             DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt             DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                                 ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_user_email (email),

  CONSTRAINT fk_user_poste
    FOREIGN KEY (idPoste)   REFERENCES poste(id)
    ON UPDATE CASCADE ON DELETE SET NULL,

  CONSTRAINT fk_user_rang
    FOREIGN KEY (idRang)    REFERENCES rang(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,

  CONSTRAINT fk_user_manager
    FOREIGN KEY (idManager) REFERENCES user(id)
    ON UPDATE CASCADE ON DELETE SET NULL

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Utilisateurs — employés et managers';


-- ------------------------------------------------------------
--  5. RANG_PERMISSION
--  Table de liaison : chaque rang dispose d'un ensemble
--  de permissions. Le backend vérifie ici avant chaque action.
-- ------------------------------------------------------------
CREATE TABLE rang_permission (
    id            INT NOT NULL AUTO_INCREMENT,
    idRang        INT NOT NULL,
    idPermission  INT NOT NULL,

  PRIMARY KEY (id),

  CONSTRAINT fk_rp_rang
    FOREIGN KEY (idRang)       REFERENCES rang(id)
    ON UPDATE CASCADE ON DELETE CASCADE,

  CONSTRAINT fk_rp_permission
    FOREIGN KEY (idPermission) REFERENCES permission(id)
    ON UPDATE CASCADE ON DELETE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Permissions attribuées par rang';


-- ============================================================
--  DONNÉES DE BASE (seed minimal pour démarrer)
-- ============================================================

-- Rangs
INSERT INTO rang (niveau, libelle, description) VALUES
  (1, 'Manager général',  'Accès total — voit tout y compris les salaires'),
  (2, 'Manager équipe',   'Voit et gère uniquement les membres de son équipe'),
  (3, 'Employé',          'Accès à ses propres données uniquement');

-- Permissions
INSERT INTO permission (code, description) VALUES
  ('VOIR_SALAIRES',           'Consulter les salaires de tous les employés'),
  ('VOIR_EQUIPE_COMPLETE',    'Voir tous les utilisateurs de toutes les équipes'),
  ('VOIR_EQUIPE_PROPRE',      'Voir uniquement les membres sous sa direction'),
  ('VALIDER_CONGE',           'Approuver ou refuser les demandes de congé/off'),
  ('CREER_TACHE',             'Créer et assigner des tâches'),
  ('GERER_BONUS_PENALITE',    'Attribuer des bonus ou des pénalités'),
  ('GERER_UTILISATEURS',      'Créer, modifier, désactiver des comptes'),
  ('VOIR_STATS_GLOBALES',     'Accéder au dashboard global de performance'),
  ('POINTER_PRESENCE',        'Enregistrer sa propre entrée/sortie'),
  ('SOUMETTRE_DEMANDE',       'Soumettre une demande de congé ou d off'),
  ('VOIR_SES_DONNEES',        'Consulter son propre profil et statistiques');

-- Attribution des permissions par rang
-- Rang 1 (Manager général) — accès complet
INSERT INTO rang_permission (idRang, idPermission)
SELECT 1, id FROM permission;

-- Rang 2 (Manager équipe) — gère son équipe, pas les salaires ni le global
INSERT INTO rang_permission (idRang, idPermission)
SELECT 2, id FROM permission
WHERE code IN (
  'VOIR_EQUIPE_PROPRE',
  'VALIDER_CONGE',
  'CREER_TACHE',
  'GERER_BONUS_PENALITE',
  'POINTER_PRESENCE',
  'SOUMETTRE_DEMANDE',
  'VOIR_SES_DONNEES'
);

-- Rang 3 (Employé) — accès minimal à ses propres données
INSERT INTO rang_permission (idRang, idPermission)
SELECT 3, id FROM permission
WHERE code IN (
  'POINTER_PRESENCE',
  'SOUMETTRE_DEMANDE',
  'VOIR_SES_DONNEES'
);

-- ------------------------------------------------------------
--  X. EMP_PRESENCE_CHECKIN
--  Gestion des pointages d’entrée et de sortie des employés.
--  Chaque enregistrement correspond à une session de travail.
-- ------------------------------------------------------------
CREATE TABLE emp_presence_checkin (
  id                INT           NOT NULL AUTO_INCREMENT,
  idUser            INT           NOT NULL,

  debutCheckin      DATETIME      NOT NULL COMMENT 'Heure d entrée (check-in)',
  finCheckin        DATETIME          NULL COMMENT 'Heure de sortie (check-out)',

  dureeTravail      INT               NULL COMMENT 'Durée en minutes (optionnel, calculable)',

  estValide         BOOLEAN       NOT NULL DEFAULT TRUE COMMENT 'Permet d invalider un pointage si erreur',

  createdAt         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                            ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  INDEX idx_presence_user (idUser),
  INDEX idx_presence_date (debutCheckin),

  CONSTRAINT fk_presence_user
    FOREIGN KEY (idUser) REFERENCES user(id)
    ON UPDATE CASCADE ON DELETE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
COMMENT='Historique des présences (check-in / check-out)';

-- ------------------------------------------------------------
--  X. CONFIG_GLOBAL
--  Configuration globale de l'application (1 seule ligne).
-- ------------------------------------------------------------
CREATE TABLE config_global (
  id                          INT           NOT NULL AUTO_INCREMENT,

  baremePointBonus            INT           NOT NULL DEFAULT 75 COMMENT 'Points nécessaires pour déclencher un bonus',
  pourcentageBonusParSalaire  DECIMAL(5,2)  NOT NULL DEFAULT 25.00 COMMENT 'Pourcentage du salaire pour calcul du bonus',

  heureEntrer                 TIME          NOT NULL DEFAULT '09:00:00',
  tolerenceRetard             INT           NOT NULL DEFAULT 10 COMMENT 'Tolérance de retard en minutes',
  heureSortie                 TIME          NOT NULL DEFAULT '18:10:00',

  createdAt                   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt                   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                                     ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  CONSTRAINT chk_bonus_percent
    CHECK (pourcentageBonusParSalaire >= 0 AND pourcentageBonusParSalaire <= 100),

  CONSTRAINT chk_tolerance_retard
    CHECK (tolerenceRetard >= 0)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
COMMENT='Configuration globale (une seule ligne)';

-- ------------------------------------------------------------
--  X. CONFIG_ABSENCE
--  Paramétrage des types d'absences et règles associées
-- ------------------------------------------------------------
CREATE TABLE config_absence (
  id                      INT           NOT NULL AUTO_INCREMENT,

  typeAbsence             ENUM('OFF', 'CONGE') NOT NULL COMMENT 'Type d absence',

  joursAutorises          INT           NOT NULL COMMENT 'Nombre de jours autorisés',
  joursAvantAutorisation  INT           NOT NULL COMMENT 'Nombre de jours minimum avant demande',

  estActif                BOOLEAN       NOT NULL DEFAULT TRUE,

  createdAt               DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt               DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                                   ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  UNIQUE KEY uq_type_absence (typeAbsence),

  CONSTRAINT chk_jours_autorises
    CHECK (joursAutorises >= 0),

  CONSTRAINT chk_jours_avant
    CHECK (joursAvantAutorisation >= 0)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
COMMENT='Configuration des types d absences';

-- ------------------------------------------------------------
--  X. EMP_ABSENCE
--  Demandes d absence des employés avec workflow validation
-- ------------------------------------------------------------
CREATE TABLE emp_absence (
  id                    INT           NOT NULL AUTO_INCREMENT,

  idConfigAbsence       INT           NOT NULL,
  idUserDemandeur       INT           NOT NULL,
  idUserValidateur      INT               NULL COMMENT 'Rempli après validation/refus',

  dateDemande           DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  dateDebutAbsence      DATE          NOT NULL,
  dateFinAbsence        DATE          NOT NULL,
  typeJournee           ENUM('JOURNEE', 'MATIN', 'APRES_MIDI')
                                        NOT NULL DEFAULT 'JOURNEE' COMMENT 'Gestion des demi-journées',

  statut                ENUM('ATTENTE', 'VALIDE', 'REFUSE')
                                        NOT NULL DEFAULT 'ATTENTE',

  priorite              ENUM('BASSE', 'NORMALE', 'HAUTE')
                                        NOT NULL DEFAULT 'NORMALE',

  motif                 VARCHAR(255)      NULL,

  createdAt             DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt             DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                                   ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  INDEX idx_abs_user (idUserDemandeur),
  INDEX idx_abs_statut (statut),
  INDEX idx_abs_date (dateDebutAbsence, dateFinAbsence),

  CONSTRAINT fk_abs_config
    FOREIGN KEY (idConfigAbsence) REFERENCES config_absence(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,

  CONSTRAINT fk_abs_user_demandeur
    FOREIGN KEY (idUserDemandeur) REFERENCES user(id)
    ON UPDATE CASCADE ON DELETE CASCADE,

  CONSTRAINT fk_abs_user_validateur
    FOREIGN KEY (idUserValidateur) REFERENCES user(id)
    ON UPDATE CASCADE ON DELETE SET NULL,

  CONSTRAINT chk_dates_absence
    CHECK (dateFinAbsence >= dateDebutAbsence)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
COMMENT='Demandes d absences des employés';

-- ------------------------------------------------------------
--  X. TYPE_PENALITE_ABSENCE
--  Catalogue des pénalités liées aux absences
-- ------------------------------------------------------------
CREATE TABLE type_penalite_absence (
  id                INT           NOT NULL AUTO_INCREMENT,

  code              ENUM('P1', 'P2', 'P3', 'P4')
                                      NOT NULL COMMENT 'Niveau de pénalité',
  titre             VARCHAR(100)  NOT NULL COMMENT 'Ex: 1er avertissement, Blâme, Suspension',

  malus             INT           NOT NULL COMMENT 'Points négatifs appliqués',

  description       VARCHAR(255)      NULL,

  estActif          BOOLEAN       NOT NULL DEFAULT TRUE,

  createdAt         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                               ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_penalite_code (code),

  CONSTRAINT chk_malus_positive
    CHECK (malus >= 0)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
COMMENT='Types de pénalités liées aux absences';

-- ------------------------------------------------------------
--  X. EMP_PENALITE_ABSENCE
--  Historique des pénalités attribuées aux employés
-- ------------------------------------------------------------
CREATE TABLE emp_penalite_absence (
  id                    INT           NOT NULL AUTO_INCREMENT,

  idUser                INT           NOT NULL,
  idTypePenalite        INT           NOT NULL,

  dateObtention         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  idAbsenceLiee         INT               NULL COMMENT 'Lien optionnel vers emp_absence',

  commentaire           VARCHAR(255)      NULL,

  createdAt             DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt             DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                                     ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),

  INDEX idx_penalite_user (idUser),
  INDEX idx_penalite_date (dateObtention),

  CONSTRAINT fk_penalite_user
    FOREIGN KEY (idUser) REFERENCES user(id)
    ON UPDATE CASCADE ON DELETE CASCADE,

  CONSTRAINT fk_penalite_type
    FOREIGN KEY (idTypePenalite) REFERENCES type_penalite_absence(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,

  CONSTRAINT fk_penalite_absence
    FOREIGN KEY (idAbsenceLiee) REFERENCES emp_absence(id)
    ON UPDATE CASCADE ON DELETE SET NULL

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
COMMENT='Pénalités appliquées aux employés';

-- ------------------------------------------------------------
--  X. CONFIG_FERIER
--  Liste des jours fériés (annuels ou spécifiques)
-- ------------------------------------------------------------
CREATE TABLE config_ferier (
  id              INT           NOT NULL AUTO_INCREMENT,

  dateFerie       DATE          NOT NULL,
  description     VARCHAR(150)  NOT NULL,

  estRecurrent    BOOLEAN       NOT NULL DEFAULT FALSE COMMENT 'TRUE = se répète chaque année (ex: 1er janvier)',

  createdAt       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                           ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  UNIQUE KEY uq_date_ferie (dateFerie)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
COMMENT='Configuration des jours fériés';

-- ------------------------------------------------------------
--  X. CONFIRM_HEURE_SUPP
--  Validation des heures supplémentaires
-- ------------------------------------------------------------
CREATE TABLE confirm_heure_supp (
  id                    INT           NOT NULL AUTO_INCREMENT,

  idUser                INT           NOT NULL,
  idPresenceCheckin     INT           NOT NULL COMMENT 'Lien avec la session de travail',

  heureSortieReelle     DATETIME      NOT NULL COMMENT 'Heure réelle de sortie',
  heureSortieTheorique  TIME          NOT NULL COMMENT 'Depuis config_global',

  dureeSupp             INT               NULL COMMENT 'Durée en minutes (calculable)',

  estValide             BOOLEAN       NOT NULL DEFAULT FALSE,
  idUserValidateur      INT               NULL,

  motifSupp             VARCHAR(255)      NULL,

  createdAt             DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt             DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                                 ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  INDEX idx_supp_user (idUser),

  CONSTRAINT fk_supp_user
    FOREIGN KEY (idUser) REFERENCES user(id)
    ON UPDATE CASCADE ON DELETE CASCADE,

  CONSTRAINT fk_supp_presence
    FOREIGN KEY (idPresenceCheckin) REFERENCES emp_presence_checkin(id)
    ON UPDATE CASCADE ON DELETE CASCADE,

  CONSTRAINT fk_supp_validateur
    FOREIGN KEY (idUserValidateur) REFERENCES user(id)
    ON UPDATE CASCADE ON DELETE SET NULL

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
COMMENT='Validation des heures supplémentaires';

-- ------------------------------------------------------------
--  X. CONFIG_EMP_POINT
--  Configuration des règles de points (bonus / malus)
-- ------------------------------------------------------------
CREATE TABLE config_emp_point (
  id                INT           NOT NULL AUTO_INCREMENT,

  typePoint         ENUM('BONUS', 'MALUS')
                                      NOT NULL COMMENT 'Nature du point',

  code              VARCHAR(50)   NOT NULL COMMENT 'Ex: PRESENCE_OK, RETARD, ABSENCE_INJUSTIFIEE',

  valeur            INT           NOT NULL COMMENT 'Nombre de points (+ ou -)',

  estFixe           BOOLEAN       NOT NULL DEFAULT TRUE COMMENT 'TRUE = valeur fixe, FALSE = calcul dynamique',
  estActif          BOOLEAN       NOT NULL DEFAULT TRUE,

  dateCreation      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  dateArchivage     DATETIME          NULL,

  description       VARCHAR(255)      NULL,

  PRIMARY KEY (id),
  UNIQUE KEY uq_point_code (code),

  CONSTRAINT chk_valeur_positive
    CHECK (valeur >= 0)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
COMMENT='Configuration des points (bonus / malus)';

-- ------------------------------------------------------------
--  X. EMP_POINT
--  Historique des points attribués aux employés
-- ------------------------------------------------------------
CREATE TABLE emp_point (
  id                  INT           NOT NULL AUTO_INCREMENT,

  idUser              INT           NOT NULL,
  idConfigEmpPoint    INT           NOT NULL,

  points              INT           NOT NULL COMMENT 'Valeur finale appliquée (+ ou -)',

  dateAttribution     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  dateFinSemaine      DATE              NULL COMMENT 'Pour regroupement hebdomadaire',

  source              ENUM('PRESENCE', 'ABSENCE', 'PENALITE', 'MANUEL')
                                        NOT NULL COMMENT 'Origine du point',

  idSource            INT               NULL COMMENT 'ID lié (ex: id absence, id checkin...)',

  commentaire         VARCHAR(255)      NULL,

  createdAt           DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  INDEX idx_point_user (idUser),
  INDEX idx_point_semaine (dateFinSemaine),

  CONSTRAINT fk_point_user
    FOREIGN KEY (idUser) REFERENCES user(id)
    ON UPDATE CASCADE ON DELETE CASCADE,

  CONSTRAINT fk_point_config
    FOREIGN KEY (idConfigEmpPoint) REFERENCES config_emp_point(id)
    ON UPDATE CASCADE ON DELETE RESTRICT

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
COMMENT='Historique des points des employés';