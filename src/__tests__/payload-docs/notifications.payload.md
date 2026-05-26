# Notifications — Payload Reference

Base URL: `http://localhost:3000/api`

All routes require: `Authorization: Bearer <token>`

---

## How notifications work

Notifications use **Server-Sent Events (SSE)** for real-time delivery. The flow is:

1. Frontend opens a persistent connection to `/notifications/stream`
2. Server pushes events as they occur (leave request submitted, approved, etc.)
3. Frontend also polls `GET /notifications` to list all past notifications
4. User reads a notification → `PATCH /notifications/:id/read`

---

## GET `/notifications/stream`

Opens a real-time SSE (Server-Sent Events) stream. **This is a persistent connection — do not close it.**

No body, no query params.

**Headers required:**
```
Authorization: Bearer <token>
Accept: text/event-stream
```

**Stream format**

The server sends newline-delimited events. Each event is:

```
data: {"id":1,"type":"INFO","title":"Nouvelle demande d'absence","message":"...","isLu":false,"createdAt":"2026-05-26T10:00:00.000Z"}\n\n
```

**How to connect in JavaScript:**

```js
const evtSource = new EventSource('/api/notifications/stream', {
  headers: { Authorization: `Bearer ${token}` }
});

evtSource.onmessage = (event) => {
  const notif = JSON.parse(event.data);
  console.log(notif.title, notif.message);
};
```

> **Note:** Native `EventSource` does not support custom headers. Use the `eventsource` npm package or pass the token as a query param if your server supports it. Alternatively, use `fetch` with `ReadableStream`.

---

## GET `/notifications`

Returns all notifications for the authenticated user (most recent first).

No body, no query params.

**200 OK**

```json
{
  "success": true,
  "data": [
    {
      "id":        1,
      "idUser":    2,
      "type":      "INFO",
      "title":     "Nouvelle demande d'absence",
      "message":   "Nouvelle demande de CONGE de EmployeTest Un",
      "payload":   { "absenceId": 1 },
      "isLu":      false,
      "createdAt": "2026-05-26T10:00:00.000Z",
      "updatedAt": "2026-05-26T10:00:00.000Z"
    },
    {
      "id":        2,
      "idUser":    3,
      "type":      "SUCCESS",
      "title":     "Demande validée",
      "message":   "Votre demande de CONGE du 15/07 au 17/07 a été validée",
      "payload":   { "absenceId": 1 },
      "isLu":      true,
      "createdAt": "2026-05-26T11:30:00.000Z",
      "updatedAt": "2026-05-26T11:35:00.000Z"
    }
  ]
}
```

| Field | Notes |
|---|---|
| `type` | `"INFO"`, `"SUCCESS"`, or `"WARNING"` — use for styling |
| `payload` | Extra data (e.g. `absenceId`) for deep-linking from the notification |
| `isLu` | `false` = unread (show badge/dot in UI) |

---

## PATCH `/notifications/:id/read`

Marks a notification as read. Also updates `vueParValidateur` on the linked absence if applicable.

**URL param:** `:id` — notification ID

No request body needed.

**200 OK**

```json
{
  "success": true,
  "message": "Notification marquée comme lue",
  "data": {
    "id":        1,
    "isLu":      true,
    "updatedAt": "2026-05-26T11:35:00.000Z"
  }
}
```

**Error cases**

| Status | Cause |
|---|---|
| `401` | No/invalid token |
| `404` | Notification ID not found or does not belong to the user |

---

## Notification types

| `type` | When it fires | Recipient |
|---|---|---|
| `INFO` | Leave request submitted | Manager of the requester |
| `SUCCESS` | Leave request approved | Employee who submitted |
| `WARNING` | Leave request refused | Employee who submitted |

---

## Frontend checklist

- [ ] Open SSE stream on login, close on logout
- [ ] Show unread count badge: `data.filter(n => !n.isLu).length`
- [ ] Mark as read when user clicks/opens a notification
- [ ] Use `payload.absenceId` to navigate directly to the relevant absence
- [ ] Handle `type` for icon/color: INFO = blue, SUCCESS = green, WARNING = orange/red
