# Presence — Payload Reference

Base URL: `http://localhost:3000/api`

All routes require: `Authorization: Bearer <token>`

---

## POST `/presence/entree`

Records a clock-in for the authenticated user.

**Request body**

```json
{
  "methode":     "wifi",
  "ssidReseau":  "COMPANY_WIFI",
  "sourceDevice": "mobile",
  "latitude":    -18.9137,
  "longitude":   47.5361
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `methode` | string | yes | `"wifi"` or `"manuel"` |
| `ssidReseau` | string | no | WiFi network name — used for trust scoring |
| `sourceDevice` | string | no | Device label (e.g. `"mobile"`, `"laptop"`) |
| `latitude` | number | no | GPS — optional, for geo trust scoring |
| `longitude` | number | no | GPS — optional |

**Trust scoring (`niveauConfiance`):** The server computes a 0–3 trust score from IP address and WiFi SSID. A score of 0 marks the checkin as `estValide: false` (requires manager review).

**201 Created**

```json
{
  "success": true,
  "message": "Pointage d'entrée enregistré",
  "data": {
    "id":               13,
    "idUser":           3,
    "debutCheckin":     "2026-05-26T06:00:00.000Z",
    "finCheckin":       null,
    "dureeTravail":     null,
    "methode":          "wifi",
    "ipAddress":        "::1",
    "ssidReseau":       "COMPANY_WIFI",
    "sourceDevice":     "mobile",
    "latitude":         null,
    "longitude":        null,
    "estRetard":        false,
    "minutesRetard":    0,
    "estAbsent":        false,
    "statut":           "present",
    "justification":    null,
    "estValide":        true,
    "niveauConfiance":  2,
    "messageConfiance": "Réseau reconnu — pointage validé",
    "createdAt":        "2026-05-26T06:00:00.781Z",
    "updatedAt":        "2026-05-26T06:00:00.781Z"
  }
}
```

| Field | Values | Meaning |
|---|---|---|
| `statut` | `"present"` / `"retard"` | On time or late |
| `estRetard` | boolean | True if arrived after configured work start |
| `minutesRetard` | integer | How many minutes late (0 if on time) |
| `estValide` | boolean | False = flagged for manager review |
| `niveauConfiance` | 0–3 | 0 = untrusted network, 3 = fully trusted |
| `finCheckin` | null on entry | Filled when clock-out is recorded |
| `dureeTravail` | null on entry | Minutes worked — filled at clock-out |

**Error cases**

| Status | Cause |
|---|---|
| `401` | No/invalid token |
| `409` | Already clocked in today |

---

## POST `/presence/sortie`

Records a clock-out for the authenticated user. Must have an open entree first.

**Request body**

```json
{
  "sourceDevice": "mobile"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `sourceDevice` | string | no | Device label |

**200 OK**

```json
{
  "success": true,
  "message": "Pointage de sortie enregistré",
  "data": {
    "id":            13,
    "idUser":        3,
    "debutCheckin":  "2026-05-26T06:00:00.000Z",
    "finCheckin":    "2026-05-26T15:10:00.000Z",
    "dureeTravail":  550,
    "methode":       "wifi",
    "ipAddress":     "::1",
    "ssidReseau":    "COMPANY_WIFI",
    "sourceDevice":  "mobile",
    "latitude":      null,
    "longitude":     null,
    "estRetard":     false,
    "minutesRetard": 0,
    "estAbsent":     false,
    "statut":        "present",
    "justification": null,
    "estValide":     true,
    "createdAt":     "2026-05-26T06:00:00.000Z",
    "updatedAt":     "2026-05-26T15:10:00.000Z"
  }
}
```

> `dureeTravail` is in **minutes** (e.g. 550 = 9h10). Divide by 60 for hours.

**Error cases**

| Status | Cause |
|---|---|
| `401` | No/invalid token |
| `404` | No open checkin found for today |

---

## GET `/presence/aujourd-hui`

Returns today's clock-in status for the authenticated user. No body, no query params.

**200 OK — clocked in and out**

```json
{
  "success": true,
  "data": {
    "aPointe":      true,
    "estSorti":     true,
    "checkin": {
      "id":            13,
      "debutCheckin":  "2026-05-26T06:00:00.000Z",
      "finCheckin":    "2026-05-26T15:10:00.000Z",
      "dureeTravail":  550,
      "statut":        "present",
      "estRetard":     false,
      "minutesRetard": 0,
      "estValide":     true
    },
    "heureEntree":   "2026-05-26T06:00:00.000Z",
    "heureSortie":   "2026-05-26T15:10:00.000Z",
    "dureeTravail":  550,
    "estRetard":     false,
    "minutesRetard": 0,
    "estValide":     true
  }
}
```

**200 OK — not yet clocked in**

```json
{
  "success": true,
  "data": {
    "aPointe":  false,
    "estSorti": false,
    "checkin":  null
  }
}
```

| Field | Meaning |
|---|---|
| `aPointe` | Has the user clocked in today? |
| `estSorti` | Has the user clocked out? |
| `checkin` | Full checkin record, or `null` |

---

## GET `/presence/mes-stats`

Monthly attendance statistics for the authenticated user.

**Query parameters**

| Param | Type | Required | Default |
|---|---|---|---|
| `mois` | integer (1–12) | no | current month |
| `annee` | integer | no | current year |

Example: `GET /presence/mes-stats?mois=5&annee=2026`

**200 OK**

```json
{
  "success": true,
  "data": {
    "mois":                 5,
    "annee":                2026,
    "totalJoursPresents":   20,
    "joursComplets":        18,
    "totalRetards":         2,
    "totalMinutesTravail":  9600,
    "totalHeuresTravail":   160,
    "joursOuvrables":       22,
    "tauxAssiduite":        91,
    "pointagesSuspects":    0,
    "historique": [
      {
        "id":            1,
        "debutCheckin":  "2026-05-02T06:00:00.000Z",
        "finCheckin":    "2026-05-02T15:00:00.000Z",
        "dureeTravail":  540,
        "methode":       "manuel",
        "estRetard":     false,
        "minutesRetard": 0,
        "statut":        "present",
        "estValide":     true
      }
    ]
  }
}
```

| Field | Notes |
|---|---|
| `tauxAssiduite` | 0–100 percent attendance rate |
| `joursOuvrables` | Weekdays in the month (public holidays excluded) |
| `pointagesSuspects` | Checkins with `estValide: false` |
| `historique` | One entry per day worked |

---

## GET `/presence/equipe`

Team attendance summary. Requires `VOIR_EQUIPE_PROPRE` permission (Manager or Admin).

**Query parameters** — same as `/mes-stats`

| Param | Type | Required | Default |
|---|---|---|---|
| `mois` | integer | no | current month |
| `annee` | integer | no | current year |

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
      "stats": {
        "mois":               5,
        "annee":              2026,
        "totalJoursPresents": 20,
        "joursComplets":      18,
        "totalRetards":       2,
        "totalMinutesTravail": 9600,
        "totalHeuresTravail": 160,
        "joursOuvrables":     22,
        "tauxAssiduite":      91,
        "pointagesSuspects":  0,
        "historique":         []
      }
    }
  ]
}
```

> Admin (niveau 1) sees all employees. Manager (niveau 2) sees only their direct reports.

**Error cases**

| Status | Cause |
|---|---|
| `401` | No/invalid token |
| `403` | User is not a manager or admin (rang 3) |
