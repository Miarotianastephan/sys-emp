# API Payload Documentation — Frontend Integration Guide

> **What this folder is:** One reference file per API module, covering every endpoint's request body, response shape, field definitions, and error codes. Generated from the test suite and route definitions.

Base URL: `http://localhost:3000/api`

All protected endpoints require: `Authorization: Bearer <token>`

Get a token from `POST /auth/login`.

---

## Files in this folder

| File | Module | Endpoints |
|---|---|---|
| [auth.payload.md](./auth.payload.md) | Authentication | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` |
| [presence.payload.md](./presence.payload.md) | Clock-in/out | `POST /presence/entree`, `POST /presence/sortie`, `GET /presence/aujourd-hui`, `GET /presence/mes-stats`, `GET /presence/equipe` |
| [absences.payload.md](./absences.payload.md) | Leave requests | `GET /absences/config`, `POST /absences/demande`, `GET /absences/mes-demandes`, `GET /absences/equipe`, `PATCH /absences/:id/validation` |
| [ferier.payload.md](./ferier.payload.md) | Public holidays | `GET /feriers`, `GET /feriers/:id`, `POST /feriers`, `PUT /feriers/:id`, `DELETE /feriers/:id` |
| [tasks.payload.md](./tasks.payload.md) | Task management | `POST /tasks`, `PUT /tasks/:id`, `GET /tasks/mes-taches`, `GET /tasks/equipe`, `GET /tasks/:id`, `PATCH /tasks/:id/complete`, `GET /tasks/stats/:idUser` |
| [bonus.payload.md](./bonus.payload.md) | Bonus & penalties | `POST /bonus/calculer/:idUser`, `POST /bonus/calculer-equipe`, `POST /bonus/manuel`, `GET /bonus/mon-resume`, `GET /bonus/resume/:idUser`, `GET /bonus/equipe`, `GET /bonus/config`, `POST /bonus/config`, `PUT /bonus/config/:id` |
| [notifications.payload.md](./notifications.payload.md) | Real-time alerts | `GET /notifications/stream` (SSE), `GET /notifications`, `PATCH /notifications/:id/read` |

---

## Universal response envelope

Every JSON response uses the same wrapper:

```json
{
  "success": true,
  "message": "Optional human-readable message",
  "data":    { ... }
}
```

On errors:

```json
{
  "success": false,
  "error":   "Short error message",
  "details": [ ... ]
}
```

> `details` is an array of validation errors — present only on `400` responses with field-level failures.

---

## Standard status codes

| Code | Meaning |
|---|---|
| `200` | OK |
| `201` | Created |
| `400` | Bad request (invalid/missing field) |
| `401` | Unauthenticated (no token or expired) |
| `403` | Forbidden (logged in but insufficient permission) |
| `404` | Resource not found |
| `409` | Conflict (duplicate entry, already clocked in, etc.) |
| `500` | Internal server error |

---

## Permission-based access summary

| Who | Permissions | Can access |
|---|---|---|
| **Rang 3** (Employee) | `VOIR_SES_DONNEES`, `POINTER_PRESENCE`, `SOUMETTRE_DEMANDE` | Own profile, clock in/out, submit leave, view own tasks, view own bonus |
| **Rang 2** (Manager) | + `VOIR_EQUIPE_PROPRE`, `VALIDER_CONGE`, `CREER_TACHE`, `GERER_BONUS_PENALITE` | All of rang 3 + team presence, validate leave, assign tasks, calculate bonuses |
| **Rang 1** (Admin) | + `VOIR_EQUIPE_COMPLETE`, `VOIR_STATS_GLOBALES`, `GERER_UTILISATEURS` | Everything + bulk operations, create holidays, register users |

---

## Recommended integration order

Build in this order to unblock each feature progressively:

1. `auth` — login flow, token storage, permission gating
2. `presence` — clock in/out dashboard (most visible feature)
3. `absences` — leave request form + manager approval panel
4. `notifications` — SSE stream + unread badge
5. `tasks` — task list + completion button
6. `bonus` — payslip summary page
7. `ferier` — admin-only holiday calendar management
