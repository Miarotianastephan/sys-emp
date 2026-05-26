# Jours Fériés (Ferier) — Payload Reference

Base URL: `http://localhost:3000/api`

All routes require: `Authorization: Bearer <token>`

> **Who can manage holidays:** Only Admin (niveau 1) can create, update, and delete. All authenticated users can read.

---

## GET `/feriers`

Returns all public holidays, optionally filtered by year.

**Query parameters**

| Param | Type | Required | Notes |
|---|---|---|---|
| `annee` | integer | no | Filter by year (e.g. `2026`) |

Example: `GET /feriers?annee=2026`

**200 OK**

```json
{
  "success": true,
  "data": [
    {
      "id":           1,
      "dateFerie":    "2026-01-01T00:00:00.000Z",
      "description":  "Jour de l'An",
      "estRecurrent": true,
      "createdAt":    "2026-01-01T00:00:00.000Z",
      "updatedAt":    "2026-01-01T00:00:00.000Z"
    },
    {
      "id":           2,
      "dateFerie":    "2026-03-29T00:00:00.000Z",
      "description":  "Journée du Souvenir",
      "estRecurrent": true,
      "createdAt":    "2026-01-01T00:00:00.000Z",
      "updatedAt":    "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

| Field | Notes |
|---|---|
| `estRecurrent` | `true` = repeats every year on the same date |
| `dateFerie` | ISO datetime — use `.slice(0, 10)` to get `YYYY-MM-DD` |

---

## GET `/feriers/:id`

Returns a single public holiday by ID.

**URL param:** `:id` — holiday ID

**200 OK**

```json
{
  "success": true,
  "data": {
    "id":           1,
    "dateFerie":    "2026-01-01T00:00:00.000Z",
    "description":  "Jour de l'An",
    "estRecurrent": true,
    "createdAt":    "2026-01-01T00:00:00.000Z",
    "updatedAt":    "2026-01-01T00:00:00.000Z"
  }
}
```

**Error cases**

| Status | Cause |
|---|---|
| `401` | No/invalid token |
| `404` | ID not found |

---

## POST `/feriers`

Creates a new public holiday. Admin only (`GERER_UTILISATEURS` or equivalent top-level permission).

**Request body**

```json
{
  "dateFerie":    "2026-11-01",
  "description":  "Toussaint",
  "estRecurrent": true
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `dateFerie` | date (YYYY-MM-DD) | yes | Must be unique |
| `description` | string | yes | |
| `estRecurrent` | boolean | no | Default `false` |

**201 Created**

```json
{
  "success": true,
  "message": "Jour férié créé",
  "data": {
    "id":           5,
    "dateFerie":    "2026-11-01T00:00:00.000Z",
    "description":  "Toussaint",
    "estRecurrent": true,
    "createdAt":    "2026-05-26T10:00:00.000Z",
    "updatedAt":    "2026-05-26T10:00:00.000Z"
  }
}
```

**Error cases**

| Status | Cause |
|---|---|
| `400` | Missing `dateFerie` or `description` |
| `401` | No/invalid token |
| `403` | User is not Admin (rang 3 or rang 2) |
| `409` | A holiday already exists on that date |

---

## PUT `/feriers/:id`

Updates an existing public holiday. Admin only.

**URL param:** `:id` — holiday ID

**Request body** — send only the fields you want to change

```json
{
  "description":  "Description mise à jour",
  "estRecurrent": false
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `description` | string | no | |
| `estRecurrent` | boolean | no | |
| `dateFerie` | date | no | Must remain unique if changed |

> At least one field is required (validation will reject an empty body).

**200 OK**

```json
{
  "success": true,
  "data": {
    "id":           5,
    "dateFerie":    "2026-11-01T00:00:00.000Z",
    "description":  "Description mise à jour",
    "estRecurrent": false,
    "updatedAt":    "2026-05-26T11:00:00.000Z"
  }
}
```

**Error cases**

| Status | Cause |
|---|---|
| `400` | Empty body |
| `401` | No/invalid token |
| `403` | Not Admin |
| `404` | ID not found |
| `409` | New date conflicts with another existing holiday |

---

## DELETE `/feriers/:id`

Deletes a public holiday permanently. Admin only.

**URL param:** `:id` — holiday ID

No request body needed.

**200 OK**

```json
{
  "success": true,
  "message": "Jour férié supprimé"
}
```

**Error cases**

| Status | Cause |
|---|---|
| `401` | No/invalid token |
| `403` | Not Admin |
| `404` | ID not found |
