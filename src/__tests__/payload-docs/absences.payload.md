# Absences — Payload Reference

Base URL: `http://localhost:3000/api`

All routes require: `Authorization: Bearer <token>`

**Absence workflow:** `ATTENTE → VALIDE` or `ATTENTE → REFUSE`

---

## GET `/absences/config`

Returns all active absence type configurations. Must be fetched first to obtain `idConfigAbsence` before submitting a request.

No body, no query params.

**200 OK**

```json
{
  "success": true,
  "data": [
    {
      "id":            1,
      "typeAbsence":   "CONGE",
      "libelle":       "Congé annuel",
      "joursAutorises": 30,
      "estActif":      true
    },
    {
      "id":            2,
      "typeAbsence":   "OFF",
      "libelle":       "Congé compensatoire",
      "joursAutorises": 2,
      "estActif":      true
    }
  ]
}
```

| Field | Notes |
|---|---|
| `typeAbsence` | `"CONGE"` (annual leave) or `"OFF"` (compensatory) |
| `joursAutorises` | Maximum days allowed per period |

---

## POST `/absences/demande`

Submits a leave request for the authenticated user. Requires `SOUMETTRE_DEMANDE` permission (all employees have it).

**Request body**

```json
{
  "idConfigAbsence":  1,
  "dateDebutAbsence": "2026-07-15",
  "dateFinAbsence":   "2026-07-17",
  "typeJournee":      "JOURNEE",
  "priorite":         "NORMALE",
  "motif":            "Vacances annuelles"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `idConfigAbsence` | integer | yes | From `GET /absences/config` |
| `dateDebutAbsence` | date (YYYY-MM-DD) | yes | Start date |
| `dateFinAbsence` | date (YYYY-MM-DD) | yes | Must be ≥ dateDebutAbsence |
| `typeJournee` | string | yes | `"JOURNEE"`, `"MATIN"`, or `"APRES_MIDI"` |
| `priorite` | string | no | `"NORMALE"` (default) or `"HAUTE"` |
| `motif` | string | no | Reason for the absence |

**201 Created**

```json
{
  "success": true,
  "message": "Demande créée avec succès",
  "data": {
    "id":                    1,
    "idConfigAbsence":       1,
    "idUserDemandeur":       3,
    "dateDemande":           "2026-05-26T10:00:00.000Z",
    "dateDebutAbsence":      "2026-07-15",
    "dateFinAbsence":        "2026-07-17",
    "nombreJours":           3,
    "typeJournee":           "JOURNEE",
    "statut":                "ATTENTE",
    "priorite":              "NORMALE",
    "motif":                 "Vacances annuelles",
    "commentaireValidateur": null,
    "vueParValidateur":      false,
    "createdAt":             "2026-05-26T10:00:00.000Z",
    "updatedAt":             "2026-05-26T10:00:00.000Z"
  }
}
```

| Field | Notes |
|---|---|
| `statut` | Always `"ATTENTE"` on creation |
| `nombreJours` | Computed by the server (respects weekends and public holidays) |
| `vueParValidateur` | `false` until the manager reads the notification |

**Error cases**

| Status | Cause |
|---|---|
| `400` | `dateFinAbsence` before `dateDebutAbsence`, missing required field |
| `401` | No/invalid token |
| `409` | Dates overlap with an existing approved absence |

---

## GET `/absences/mes-demandes`

Returns all leave requests submitted by the authenticated user.

No body, no query params.

**200 OK**

```json
{
  "success": true,
  "data": [
    {
      "id":                    1,
      "idConfigAbsence":       1,
      "idUserDemandeur":       3,
      "dateDemande":           "2026-05-26T10:00:00.000Z",
      "dateDebutAbsence":      "2026-07-15",
      "dateFinAbsence":        "2026-07-17",
      "nombreJours":           3,
      "typeJournee":           "JOURNEE",
      "statut":                "ATTENTE",
      "priorite":              "NORMALE",
      "motif":                 "Vacances annuelles",
      "commentaireValidateur": null,
      "vueParValidateur":      false,
      "configAbsence": {
        "id":            1,
        "typeAbsence":   "CONGE",
        "libelle":       "Congé annuel",
        "joursAutorises": 30,
        "estActif":      true
      },
      "validateur": null
    }
  ]
}
```

> `validateur` is populated once the request has been processed (contains `{ id, nom, prenom }`).

---

## GET `/absences/equipe`

Returns all pending and processed leave requests for the manager's team. Requires `VALIDER_CONGE` permission.

No body, no query params.

**200 OK**

```json
{
  "success": true,
  "data": [
    {
      "id":                    1,
      "idUserDemandeur":       3,
      "idUserValidateur":      2,
      "dateDemande":           "2026-05-26T10:00:00.000Z",
      "dateDebutAbsence":      "2026-07-15",
      "dateFinAbsence":        "2026-07-17",
      "nombreJours":           3,
      "typeJournee":           "JOURNEE",
      "statut":                "ATTENTE",
      "priorite":              "NORMALE",
      "motif":                 "Vacances annuelles",
      "commentaireValidateur": null,
      "vueParValidateur":      false,
      "demandeur": {
        "id":     3,
        "nom":    "EmployeTest",
        "prenom": "Un",
        "email":  "employe@test.mg"
      },
      "configAbsence": {
        "id":             1,
        "typeAbsence":    "CONGE",
        "libelle":        "Congé annuel",
        "joursAutorises": 30,
        "estActif":       true
      }
    }
  ]
}
```

**Error cases**

| Status | Cause |
|---|---|
| `401` | No/invalid token |
| `403` | User lacks `VALIDER_CONGE` permission (rang 3) |

---

## PATCH `/absences/:id/validation`

Approves or refuses a leave request. Requires `VALIDER_CONGE` permission.

**URL param:** `:id` — the absence ID from `GET /absences/equipe`

**Request body**

```json
{
  "statut":                "VALIDE",
  "commentaireValidateur": "Approuvé — bon courage !"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `statut` | string | yes | `"VALIDE"` or `"REFUSE"` |
| `commentaireValidateur` | string | no | Optional comment for the employee |

**200 OK**

```json
{
  "success": true,
  "message": "Demande validée avec succès",
  "data": {
    "id":                    1,
    "statut":                "VALIDE",
    "commentaireValidateur": "Approuvé — bon courage !",
    "vueParValidateur":      true,
    "updatedAt":             "2026-05-26T11:30:00.000Z"
  }
}
```

**Error cases**

| Status | Cause |
|---|---|
| `401` | No/invalid token |
| `403` | User is rang 3 (no permission) |
| `404` | Absence ID not found |

---

## Status values

| Value | Meaning |
|---|---|
| `ATTENTE` | Submitted, awaiting manager decision |
| `VALIDE` | Approved by manager |
| `REFUSE` | Refused by manager |

## typeJournee values

| Value | Meaning |
|---|---|
| `JOURNEE` | Full day(s) |
| `MATIN` | Morning only |
| `APRES_MIDI` | Afternoon only |
