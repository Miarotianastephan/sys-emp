# Auth — Payload Reference

Base URL: `http://localhost:3000/api`

All protected routes require: `Authorization: Bearer <token>`

All responses follow the envelope: `{ success, message?, data?, error?, details? }`

---

## POST `/auth/register`

Creates a new user account. Admin only in practice (no permission guard — protect at the UI level or add `authorize` if needed).

**Request body**

```json
{
  "nom":          "Dupont",
  "prenom":       "Jean",
  "email":        "jean@societe.mg",
  "motDePasse":   "Test1234!",
  "dateEmbauche": "2024-06-01",
  "idRang":       3
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `nom` | string | yes | |
| `prenom` | string | yes | |
| `email` | string (email) | yes | Must be unique |
| `motDePasse` | string | yes | Min 8 chars |
| `dateEmbauche` | date (YYYY-MM-DD) | yes | |
| `idRang` | integer | yes | Must exist in DB |
| `idManager` | integer | no | FK to another user |

**201 Created**

```json
{
  "success": true,
  "message": "Compte créé avec succès",
  "data": {
    "id":           4,
    "nom":          "Dupont",
    "prenom":       "Jean",
    "email":        "jean@societe.mg",
    "dateEmbauche": "2024-06-01",
    "idRang":       3,
    "estActif":     true,
    "createdAt":    "2026-05-26T08:00:00.000Z",
    "updatedAt":    "2026-05-26T08:00:00.000Z"
  }
}
```

> `motDePasse` is **never** returned in any response.

**Error cases**

| Status | Cause |
|---|---|
| `400` | Missing/invalid field — `res.body.details` is an array of field errors |
| `409` | Email already exists |

---

## POST `/auth/login`

**Request body**

```json
{
  "email":      "admin@test.mg",
  "motDePasse": "Test1234!"
}
```

**200 OK**

```json
{
  "success": true,
  "message": "Connexion réussie",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id":     1,
      "nom":    "AdminTest",
      "prenom": "Un",
      "email":  "admin@test.mg",
      "rang": {
        "id":      1,
        "niveau":  1,
        "libelle": "Manager général"
      },
      "permissions": [
        "CREER_TACHE",
        "GERER_BONUS_PENALITE",
        "GERER_UTILISATEURS",
        "POINTER_PRESENCE",
        "SOUMETTRE_DEMANDE",
        "VALIDER_CONGE",
        "VOIR_EQUIPE_COMPLETE",
        "VOIR_EQUIPE_PROPRE",
        "VOIR_SALAIRES",
        "VOIR_SES_DONNEES",
        "VOIR_STATS_GLOBALES"
      ]
    }
  }
}
```

> Save `data.token` — send it as `Authorization: Bearer <token>` on every subsequent request.
>
> `data.user.permissions` drives what the frontend should show/hide.

**Error cases**

| Status | Cause |
|---|---|
| `400` | Missing email or motDePasse |
| `401` | Wrong credentials or user not found |

---

## GET `/auth/me`

Returns the profile of the currently logged-in user. No body needed.

**Headers:** `Authorization: Bearer <token>`

**200 OK**

```json
{
  "success": true,
  "data": {
    "id":           1,
    "nom":          "AdminTest",
    "prenom":       "Un",
    "email":        "admin@test.mg",
    "dateEmbauche": "2024-01-01",
    "estActif":     true,
    "rang": {
      "id":      1,
      "niveau":  1,
      "libelle": "Manager général"
    },
    "permissions": ["CREER_TACHE", "GERER_BONUS_PENALITE", "..."]
  }
}
```

**Error cases**

| Status | Cause |
|---|---|
| `401` | No token, expired token, or malformed token |

---

## Permission codes reference

These strings live in `data.user.permissions` after login. Use them to conditionally enable UI features.

| Code | Who has it | What it unlocks |
|---|---|---|
| `VOIR_SES_DONNEES` | Everyone | Own profile, own presence, own tasks |
| `POINTER_PRESENCE` | Everyone | Clock in / clock out |
| `SOUMETTRE_DEMANDE` | Everyone | Submit leave requests |
| `VOIR_EQUIPE_PROPRE` | Manager + Admin | Team presence, team tasks, team bonus view |
| `VOIR_EQUIPE_COMPLETE` | Admin only | All-team overview, bulk bonus calculation |
| `VALIDER_CONGE` | Manager + Admin | Approve/refuse leave requests |
| `CREER_TACHE` | Manager + Admin | Assign tasks |
| `GERER_BONUS_PENALITE` | Manager + Admin | Calculate and manage bonuses |
| `VOIR_SALAIRES` | Manager + Admin | Salary figures |
| `VOIR_STATS_GLOBALES` | Admin only | Global statistics |
| `GERER_UTILISATEURS` | Admin only | Register new users |
