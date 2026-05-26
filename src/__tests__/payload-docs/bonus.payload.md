# Bonus & Pénalités — Payload Reference

Base URL: `http://localhost:3000/api`

All routes require: `Authorization: Bearer <token>`

---

## How bonuses work

The calculation engine reads two inputs for a given employee/month:

1. **Présence data** → ASSIDUITE bonus (good attendance) + RETARD penalty (too many late arrivals) + ABSENCE penalty
2. **Task performance** → TACHE bonus (based on `scorePourcentage` from `/tasks/stats`)

Rules are defined in `ConfigBonusPenalite` (see `GET /bonus/config`).
The calculation is **idempotent** — running it twice for the same user/month creates 0 new records on the second call.

---

## POST `/bonus/calculer/:idUser`

Runs the bonus/penalty calculation for a single employee for the given month. Requires `GERER_BONUS_PENALITE`.

**URL param:** `:idUser` — employee ID

**Request body**

```json
{
  "mois":  5,
  "annee": 2026
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `mois` | integer (1–12) | yes | |
| `annee` | integer (≥ 2020) | yes | |

**200 OK**

```json
{
  "success": true,
  "data": {
    "bonuses": [
      {
        "id":        101,
        "idUser":    3,
        "type":      "BONUS",
        "categorie": "ASSIDUITE",
        "libelle":   "Bonus assiduité",
        "montant":   50000,
        "mois":      5,
        "annee":     2026,
        "estManuel": false
      },
      {
        "id":        102,
        "idUser":    3,
        "type":      "BONUS",
        "categorie": "TACHE",
        "libelle":   "Bonus performance",
        "montant":   30000,
        "mois":      5,
        "annee":     2026,
        "estManuel": false
      }
    ],
    "penalties": [
      {
        "id":        103,
        "idUser":    3,
        "type":      "PENALITE",
        "categorie": "RETARD",
        "libelle":   "Pénalité retard",
        "montant":   5000,
        "mois":      5,
        "annee":     2026,
        "estManuel": false
      }
    ],
    "total": 2
  }
}
```

| Field | Notes |
|---|---|
| `bonuses` | Array of new BONUS records created |
| `penalties` | Array of new PENALITE records created |
| `total` | Number of new records inserted (0 on second call = idempotent) |

**Error cases**

| Status | Cause |
|---|---|
| `401` | No/invalid token |
| `403` | Rang 3 user |

---

## POST `/bonus/calculer-equipe`

Runs calculation for **all employees** in the authenticated manager's team at once. Admin only (`VOIR_EQUIPE_COMPLETE`).

**Request body** — same as single calculation

```json
{
  "mois":  5,
  "annee": 2026
}
```

**200 OK**

```json
{
  "success": true,
  "data": [
    {
      "idUser":   3,
      "nom":      "EmployeTest",
      "prenom":   "Un",
      "bonuses":  [...],
      "penalties": [...],
      "total":    2
    },
    {
      "idUser":   2,
      "nom":      "ManagerTest",
      "prenom":   "Un",
      "bonuses":  [...],
      "penalties": [...],
      "total":    1
    }
  ]
}
```

**Error cases**

| Status | Cause |
|---|---|
| `403` | Not Admin (rang 2 and rang 3 excluded) |

---

## POST `/bonus/manuel`

Manually adds a single bonus or penalty entry. Requires `GERER_BONUS_PENALITE`.

Use this for exceptional bonuses (project awards, disciplinary deductions) that the automatic calculation wouldn't produce.

**Request body**

```json
{
  "idUser":      3,
  "type":        "BONUS",
  "categorie":   "TACHE",
  "libelle":     "Prime exceptionnelle projet client",
  "montant":     75000,
  "mois":        5,
  "annee":       2026,
  "commentaire": "Livraison anticipée du projet X"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `idUser` | integer | yes | Target employee |
| `type` | string | yes | `"BONUS"` or `"PENALITE"` |
| `categorie` | string | yes | `"TACHE"`, `"ASSIDUITE"`, `"RETARD"`, or `"ABSENCE"` |
| `libelle` | string (max 150) | yes | Label shown to the employee |
| `montant` | number (> 0) | yes | Amount in MGA — must be positive |
| `mois` | integer (1–12) | yes | |
| `annee` | integer (≥ 2020) | yes | |
| `commentaire` | string (max 2000) | no | Internal note |

**201 Created**

```json
{
  "success": true,
  "data": {
    "id":          110,
    "idUser":      3,
    "type":        "BONUS",
    "categorie":   "TACHE",
    "libelle":     "Prime exceptionnelle projet client",
    "montant":     "75000.00",
    "mois":        5,
    "annee":       2026,
    "estManuel":   true,
    "commentaire": "Livraison anticipée du projet X",
    "createdAt":   "2026-05-26T12:00:00.000Z",
    "updatedAt":   "2026-05-26T12:00:00.000Z"
  }
}
```

> `estManuel: true` distinguishes manual entries from automatically calculated ones.
>
> `montant` is returned as a string with 2 decimal places — parse with `parseFloat()` for calculations.

**Error cases**

| Status | Cause |
|---|---|
| `400` | Negative `montant`, invalid `type` or `categorie` |
| `403` | Rang 3 user |

---

## GET `/bonus/mon-resume`

Returns the bonus/penalty summary for the authenticated user.

**Query parameters**

| Param | Type | Required | Default |
|---|---|---|---|
| `mois` | integer (1–12) | no | current month |
| `annee` | integer | no | current year |

Example: `GET /bonus/mon-resume?mois=5&annee=2026`

**200 OK**

```json
{
  "success": true,
  "data": {
    "totalBonus":    80000,
    "totalPenalite": 5000,
    "soldeNet":      75000,
    "detail": [
      {
        "id":        101,
        "type":      "BONUS",
        "categorie": "ASSIDUITE",
        "libelle":   "Bonus assiduité",
        "montant":   "50000.00",
        "estManuel": false,
        "mois":      5,
        "annee":     2026
      },
      {
        "id":        102,
        "type":      "BONUS",
        "categorie": "TACHE",
        "libelle":   "Bonus performance",
        "montant":   "30000.00",
        "estManuel": false,
        "mois":      5,
        "annee":     2026
      },
      {
        "id":        103,
        "type":      "PENALITE",
        "categorie": "RETARD",
        "libelle":   "Pénalité retard",
        "montant":   "5000.00",
        "estManuel": false,
        "mois":      5,
        "annee":     2026
      }
    ]
  }
}
```

| Field | Notes |
|---|---|
| `totalBonus` | Sum of all BONUS entries |
| `totalPenalite` | Sum of all PENALITE entries |
| `soldeNet` | `totalBonus - totalPenalite` |
| `detail` | All individual entries for the period |

---

## GET `/bonus/resume/:idUser`

Same structure as `/mon-resume` but for a specific employee. Requires `GERER_BONUS_PENALITE`.

**URL param:** `:idUser` — employee ID

**Query parameters** — same as `/mon-resume`

**200 OK** — identical shape to `/mon-resume` response.

**Error cases**

| Status | Cause |
|---|---|
| `403` | Rang 3 user, or manager requesting outside their team |

---

## GET `/bonus/equipe`

Returns bonus summaries for all employees in the team. Requires `VOIR_EQUIPE_PROPRE`.

**Query parameters**

| Param | Type | Notes |
|---|---|---|
| `mois` | integer | Filter by month |
| `annee` | integer | Filter by year |
| `type` | string | `"BONUS"` or `"PENALITE"` |
| `categorie` | string | `"TACHE"`, `"ASSIDUITE"`, `"RETARD"`, `"ABSENCE"` |
| `idUser` | integer | Filter by specific employee |

**200 OK**

```json
{
  "success": true,
  "data": [
    {
      "user": {
        "id":     3,
        "nom":    "EmployeTest",
        "prenom": "Un",
        "email":  "employe@test.mg"
      },
      "totalBonus":    80000,
      "totalPenalite": 5000,
      "soldeNet":      75000
    }
  ]
}
```

---

## GET `/bonus/config`

Returns the bonus/penalty rule configurations. Requires `GERER_BONUS_PENALITE`.

**200 OK**

```json
{
  "success": true,
  "data": [
    {
      "id":             1,
      "type":           "BONUS",
      "categorie":      "ASSIDUITE",
      "libelle":        "Bonus assiduité",
      "valeur":         50000,
      "seuil":          null,
      "estPourcentage": false,
      "estActif":       true
    },
    {
      "id":             3,
      "type":           "PENALITE",
      "categorie":      "RETARD",
      "libelle":        "Pénalité retard",
      "valeur":         5000,
      "seuil":          3,
      "estPourcentage": false,
      "estActif":       true
    }
  ]
}
```

| Field | Notes |
|---|---|
| `valeur` | Fixed amount (MGA) or percentage depending on `estPourcentage` |
| `seuil` | Threshold before the rule triggers (e.g. 3 = penalty after 3 late arrivals) |
| `estPourcentage` | If `true`, `valeur` is a % of salary rather than a fixed amount |

---

## POST `/bonus/config`

Creates a new rule. Admin only.

**Request body**

```json
{
  "type":           "BONUS",
  "categorie":      "ASSIDUITE",
  "libelle":        "Nouveau bonus assiduité",
  "valeur":         60000,
  "seuil":          null,
  "estPourcentage": false,
  "estActif":       true
}
```

**201 Created** — returns the created config object.

---

## PUT `/bonus/config/:id`

Updates an existing rule. Admin only. Send only the fields to change (at least one).

```json
{
  "valeur":   70000,
  "estActif": false
}
```

**200 OK** — returns the updated config object.

---

## categorie values

| Value | Triggered by |
|---|---|
| `ASSIDUITE` | Attendance rate (presence data) |
| `TACHE` | Task performance score |
| `RETARD` | Late arrivals count |
| `ABSENCE` | Unjustified absences |
