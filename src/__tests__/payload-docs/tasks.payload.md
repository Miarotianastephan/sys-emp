# Tasks — Payload Reference

Base URL: `http://localhost:3000/api`

All routes require: `Authorization: Bearer <token>`

**Task lifecycle:** `EN_COURS → TERMINE` (completed on time) or `EN_COURS → EN_RETARD` (auto-updated when past deadline)

---

## POST `/tasks`

Assigns a new task to an employee. Requires `CREER_TACHE` permission (Manager or Admin).

**Request body**

```json
{
  "idUserAssigne": 3,
  "titre":         "Préparer rapport mensuel",
  "description":   "Inclure les données de présence et les KPIs",
  "dateDebut":     "2026-05-26",
  "dateLimite":    "2026-06-05",
  "poids":         3,
  "priorite":      "HAUTE",
  "commentaire":   "À envoyer avant 18h"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `idUserAssigne` | integer | yes | Must be in the manager's team |
| `titre` | string (max 150) | yes | |
| `description` | string | no | |
| `dateDebut` | date (YYYY-MM-DD) | yes | |
| `dateLimite` | date (YYYY-MM-DD) | yes | Must be after `dateDebut` |
| `poids` | integer (1–5) | no | Task weight for performance score. Default `1` |
| `priorite` | string | no | `"BASSE"`, `"NORMALE"` (default), `"HAUTE"` |
| `commentaire` | string (max 1000) | no | |

> **`poids` matters for bonus calculation.** Heavier tasks (poids 4–5) contribute more to the performance score and thus more to the TACHE bonus.

**201 Created**

```json
{
  "success": true,
  "data": {
    "id":             42,
    "idUserAssigne":  3,
    "idUserCreateur": 1,
    "titre":          "Préparer rapport mensuel",
    "description":    "Inclure les données de présence et les KPIs",
    "dateDebut":      "2026-05-26",
    "dateLimite":     "2026-06-05",
    "poids":          3,
    "priorite":       "HAUTE",
    "statut":         "EN_COURS",
    "commentaire":    "À envoyer avant 18h",
    "dateCompletion": null,
    "performanceScore": null,
    "createdAt":      "2026-05-26T08:00:00.000Z",
    "updatedAt":      "2026-05-26T08:00:00.000Z"
  }
}
```

**Error cases**

| Status | Cause |
|---|---|
| `400` | `poids` outside 1–5, `dateLimite` before `dateDebut`, missing required field |
| `401` | No/invalid token |
| `403` | Rang 3 user, or manager assigning to someone outside their team |

---

## PUT `/tasks/:id`

Updates a task. Requires `CREER_TACHE` permission.

**URL param:** `:id` — task ID

**Request body** — send only the fields to change (at least one required)

```json
{
  "titre":      "Titre corrigé",
  "dateLimite": "2026-06-10",
  "priorite":   "NORMALE"
}
```

| Field | Type | Notes |
|---|---|---|
| `titre` | string (max 150) | |
| `description` | string | |
| `dateDebut` | date | |
| `dateLimite` | date | |
| `poids` | integer (1–5) | |
| `priorite` | `"BASSE"` / `"NORMALE"` / `"HAUTE"` | |
| `commentaire` | string (max 1000) | |

**200 OK** — returns updated task object (same shape as POST response).

---

## GET `/tasks/mes-taches`

Returns tasks assigned to the authenticated user.

**Query parameters**

| Param | Type | Notes |
|---|---|---|
| `statut` | string | Filter: `"EN_COURS"`, `"TERMINE"`, `"EN_RETARD"` |
| `priorite` | string | Filter: `"BASSE"`, `"NORMALE"`, `"HAUTE"` |
| `mois` | integer | Filter by month |
| `annee` | integer | Filter by year |

Example: `GET /tasks/mes-taches?statut=EN_COURS`

**200 OK**

```json
{
  "success": true,
  "data": [
    {
      "id":              42,
      "idUserAssigne":   3,
      "idUserCreateur":  1,
      "titre":           "Préparer rapport mensuel",
      "description":     null,
      "dateDebut":       "2026-05-26",
      "dateLimite":      "2026-06-05",
      "poids":           3,
      "priorite":        "HAUTE",
      "statut":          "EN_COURS",
      "commentaire":     null,
      "dateCompletion":  null,
      "performanceScore": null,
      "createdAt":       "2026-05-26T08:00:00.000Z",
      "updatedAt":       "2026-05-26T08:00:00.000Z"
    }
  ]
}
```

> Tasks past their `dateLimite` are **automatically marked `EN_RETARD`** by the server on this query.

---

## GET `/tasks/equipe`

Returns tasks for the manager's team. Requires `VOIR_EQUIPE_PROPRE` permission.

**Query parameters** — same filters as `/mes-taches`

**200 OK** — same array shape as above.

**Error cases**

| Status | Cause |
|---|---|
| `403` | Rang 3 user |

---

## GET `/tasks/:id`

Returns a single task's full details.

**URL param:** `:id` — task ID

**200 OK** — same shape as a single item from the list.

**Error cases**

| Status | Cause |
|---|---|
| `403` | User is not the assignee or a manager/admin |
| `404` | ID not found |

---

## PATCH `/tasks/:id/complete`

Marks a task as completed. Only the assigned user can complete their own task.

**URL param:** `:id` — task ID

**Request body** (optional)

```json
{
  "commentaire": "Rapport envoyé à 17h45"
}
```

**200 OK**

```json
{
  "success": true,
  "data": {
    "id":               42,
    "statut":           "TERMINE",
    "dateCompletion":   "2026-05-30",
    "performanceScore": 4.5,
    "wasOnTime":        true,
    "joursRetard":      0,
    "poids":            3,
    "updatedAt":        "2026-05-30T16:45:00.000Z"
  }
}
```

| Field | Notes |
|---|---|
| `performanceScore` | Score for this task. Used in monthly bonus calculation |
| `wasOnTime` | `true` if completed before or on `dateLimite` |
| `joursRetard` | Days past the deadline (0 if on time) |

**Error cases**

| Status | Cause |
|---|---|
| `403` | User is not the task assignee |
| `404` | Task not found |
| `409` | Task is already completed |

---

## GET `/tasks/stats/:idUser`

Returns the performance summary for a given user. Requires `VOIR_EQUIPE_PROPRE`.

**URL param:** `:idUser` — the user's ID

**Query parameters**

| Param | Type | Notes |
|---|---|---|
| `mois` | integer | Filter stats to a specific month |
| `annee` | integer | Filter stats to a specific year |

**200 OK**

```json
{
  "success": true,
  "data": {
    "totalTaches":      5,
    "tachesTerminees":  4,
    "tachesEnRetard":   1,
    "scorePerformance": 18.5,
    "tauxCompletion":   80,
    "scorePourcentage": 92
  }
}
```

| Field | Notes |
|---|---|
| `scorePerformance` | Raw score (sum of weighted task scores) |
| `tauxCompletion` | % of tasks marked TERMINE |
| `scorePourcentage` | 0–100 normalized score — used in TACHE bonus calculation |

---

## Task statut values

| Value | Meaning |
|---|---|
| `EN_COURS` | Assigned and in progress |
| `EN_RETARD` | Past deadline, not yet completed — auto-set by server |
| `TERMINE` | Completed |

## poids values

| Value | Weight | Use case |
|---|---|---|
| `1` | Light | Routine, small tasks |
| `2` | Normal | Standard tasks |
| `3` | Medium | Multi-step deliverables |
| `4` | Heavy | Complex projects |
| `5` | Critical | High-impact deliverables |
