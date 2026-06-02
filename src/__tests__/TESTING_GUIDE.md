# Backend Testing Guide — Employee Management System

> **Who this is for:** QA beginners who want to understand how this test suite works and how to test the API manually without running any code.
>
> **Prerequisites:** Node.js installed, the project's `.env` file configured, and MySQL running locally.

---

## Table of Contents

1. [What are we testing?](#1-what-are-we-testing)
2. [Test file map](#2-test-file-map)
3. [How a test is structured](#3-how-a-test-is-structured)
4. [The three test users](#4-the-three-test-users)
5. [Running tests with npm](#5-running-tests-with-npm)
6. [Reading the test output](#6-reading-the-test-output)
7. [Testing the API manually with curl](#7-testing-the-api-manually-with-curl)
8. [Key patterns to recognize](#8-key-patterns-to-recognize)
9. [What each helper file does](#9-what-each-helper-file-does)
10. [Common failure causes and how to fix them](#10-common-failure-causes-and-how-to-fix-them)

---

## 1. What are we testing?

This project is a **REST API** — a backend server that receives HTTP requests and returns JSON responses. We are not testing a UI; we are testing the server's behavior directly.

The API manages employees: their logins, daily attendance check-ins, leave requests, tasks, and bonus/penalty calculations.

A test makes an **HTTP request** to the server, then checks that the **response** looks exactly as expected — correct status code, correct fields, correct values.

```
Test                     Server                   Database
 │── POST /api/auth/login ──►│                        │
 │                           │── SELECT user ... ────►│
 │                           │◄── { id, token } ──────│
 │◄── 200 { token: "..." } ──│
 │
 │ assert: status === 200 ✓
 │ assert: body has "token" ✓
```

---

## 2. Test file map

```
src/__tests__/
│
├── auth.test.js        → register, login, view profile
├── presence.test.js    → clock in, clock out, daily status, monthly stats
├── absence.test.js     → submit leave request, manager approval/refusal
├── ferier.test.js      → create/update/delete public holidays
├── tasks.test.js       → assign tasks, complete tasks, performance scores
├── bonus.test.js       → calculate bonuses, add manual entries, view summaries
├── flow.test.js        → full end-to-end journey (new employee, 20 steps)
│
└── helpers/
    ├── setup.js        → shared login tokens + state across all test files
    ├── seeds.js        → creates the 3 test users in the database
    ├── simulateData.js → inserts fake attendance records for a full month
    └── teardown.js     → closes the database connection after all tests
```

**Rule of thumb:** each `.test.js` file focuses on one feature (one group of API routes). `flow.test.js` is the only file that combines everything.

---

## 3. How a test is structured

Every test file uses the same skeleton. Read this once and you can understand any test in the suite.

```js
// 1. SETUP — runs once before all tests in this file
beforeAll(async () => {
  await initializeTestSession(); // logs in the 3 test users, stores their tokens
});

// 2. CLEANUP — runs once after all tests in this file
afterAll(async () => {
  // delete any data created during these tests
});

// 3. GROUP — describes a feature or endpoint
describe('Registration — POST /api/auth/register', () => {

  // 4. INDIVIDUAL TEST
  test('valid payload → 201, user returned without motDePasse', async () => {
    const res = await request(app)
      .post('/api/auth/register')   // which endpoint
      .send({ nom: 'Dupont', ... }) // request body

    expect(res.status).toBe(201);                         // check status code
    expect(res.body.success).toBe(true);                  // check response field
    expect(res.body.data).toHaveProperty('id');           // check field exists
    expect(res.body.data).not.toHaveProperty('motDePasse'); // check field is absent
  });

});
```

**Two vocabulary words before moving on:**

- **`async / await`** — the API calls take real time (they hit a database). `async` marks a function that does async work; `await` pauses until the result is ready. Without these, the test would check the response before it arrived.
- **`supertest`** — the library that makes HTTP requests inside a test. It talks directly to the Express app in memory — no server needs to be running on port 3000.

| Keyword                                 | What it does                                      |
| --------------------------------------- | ------------------------------------------------- |
| `beforeAll`                           | Runs once before the first test — good for setup |
| `afterAll`                            | Runs once after the last test — good for cleanup |
| `describe`                            | Groups related tests together under a label       |
| `test`                                | One specific scenario to verify                   |
| `expect(...).toBe(x)`                 | Asserts that a value equals `x` exactly         |
| `expect(...).toHaveProperty('x')`     | Asserts that a field named `x` exists           |
| `expect(...).toBeGreaterThan(0)`      | Asserts a number is above zero                    |
| `expect(...).not.toHaveProperty('x')` | Asserts a field is NOT present                    |

---

## 4. The three test users

The entire suite revolves around three pre-created users, each with a different permission level.

| User                       | Email               | Password      | Level       | Can do                                                                 |
| -------------------------- | ------------------- | ------------- | ----------- | ---------------------------------------------------------------------- |
| **rang1** (Admin)    | `admin@test.mg`   | `Test1234!` | 1 (highest) | Everything — manage all employees, calculate bonuses, create holidays |
| **rang2** (Manager)  | `manager@test.mg` | `Test1234!` | 2           | Approve leave, assign tasks to direct team, view team bonuses          |
| **rang3** (Employee) | `employe@test.mg` | `Test1234!` | 3 (lowest)  | View own data only — clock in/out, submit leave, see own tasks        |

**Hierarchy:**

```
rang1 (admin)
  └── rang2 (manager)
        └── rang3 (employee)
```

In tests, `authHeader(2)` produces `{ Authorization: "Bearer <rang2_token>" }`. The token is obtained by logging in during `beforeAll`.

---

## 5. Running tests with npm

> **Prerequisite:** the database must be seeded. Run `npm run db:setup` once before ever running tests.

### Run everything

```bash
npm test
```

### Run only one feature

```bash
npm run test:auth       # auth tests only
npm run test:presence   # presence tests only
npm run test:absence    # absence tests only
npm run test:ferier     # public holiday tests only
npm run test:tasks      # task tests only
npm run test:bonus      # bonus tests only
npm run test:flow       # full end-to-end flow only
```

### Run with detailed output (shows each test name)

```bash
npm run test:verbose
```

Verbose output looks like this — one line per test, with `✓` or `✗`:

```
PASS src/__tests__/auth.test.js
  Registration — POST /api/auth/register
    ✓ valid payload → 201, user returned without motDePasse (312 ms)
    ✓ duplicate email → 409 (89 ms)
    ✓ missing email → 400 (12 ms)
    ✓ missing motDePasse → 400 (11 ms)
  Login — POST /api/auth/login
    ✓ correct credentials → 200, token returned (98 ms)
    ✗ wrong password → 401 (10 ms)   ← this one failed
```

### What `--runInBand` means

All tests run **one file at a time, in order** — not in parallel. This is required because test files share the same database: running them at the same time would corrupt each other's data.

---

## 6. Reading the test output

### All passing

```
Test Suites: 7 passed, 7 total
Tests:       126 passed, 126 total
Time:        6.7 s
```

### A failure

```
FAIL src/__tests__/ferier.test.js

  ● Liste — GET /api/feriers › filter by annee → 200

    expect(received).toBe(expected)

    Expected: 200
    Received: 500          ← the server crashed (500 = internal error)

      124 |     expect(res.status).toBe(200);
              ^
```

How to read this:

- **`FAIL src/__tests__/ferier.test.js`** — which file failed
- **`● Liste — GET /api/feriers › filter by annee → 200`** — which `describe` › which `test`
- **`Expected: 200 / Received: 500`** — what went wrong
- The `^` arrow points to the exact line in the test

### Status codes to know

| Code    | Meaning                                       |
| ------- | --------------------------------------------- |
| `200` | OK — request succeeded                       |
| `201` | Created — new record was created             |
| `400` | Bad Request — you sent invalid data          |
| `401` | Unauthorized — no token or invalid token     |
| `403` | Forbidden — logged in but no permission      |
| `404` | Not Found — resource does not exist          |
| `409` | Conflict — duplicate (e.g. same email twice) |
| `500` | Internal Server Error — the server crashed   |

---

## 7. Testing the API manually with curl

You can reproduce any test by hand using `curl` in your terminal. Start the server first:

```bash
npm run dev
```

> **About `jq`:** The `| jq .` at the end of each curl command pretty-prints the JSON response. If you don't have `jq`, just remove `| jq .` from the command — the output will still work, just less readable. Install it with `brew install jq` (macOS) or `sudo apt install jq` (Linux).

### Step 1 — Log in and get a token

```bash
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.mg","motDePasse":"Test1234!"}' | jq .
```

Expected response:

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGci...",
    "user": { "id": 1, "nom": "AdminTest", ... }
  }
}
```

Copy the `token` value — you need it for every protected request.

**Tip — save the token into a shell variable so you don't have to paste it every time:**

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.mg","motDePasse":"Test1234!"}' | jq -r .data.token)

echo $TOKEN   # verify it was saved
```

> **No `jq`?** Run the login command without `| jq -r .data.token`, find the `"token":"eyJ..."` value in the raw JSON output, copy it manually, and then set it: `export TOKEN=eyJ...`

### Step 2 — Use the token in protected requests

```bash
# View your profile
curl -s http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer $TOKEN" | jq .

# Clock in
curl -s -X POST http://localhost:3000/api/presence/entree \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"methode":"manuel","sourceDevice":"my-laptop"}' | jq .

# Clock out
curl -s -X POST http://localhost:3000/api/presence/sortie \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sourceDevice":"my-laptop"}' | jq .
```

### Step 3 — Submit a leave request

First, look up the absence configuration IDs (you need a real one):

```bash
curl -s http://localhost:3000/api/absences/config \
  -H "Authorization: Bearer $TOKEN" | jq '.data[] | {id, typeAbsence}'
```

You'll see something like:

```json
{ "id": 1, "typeAbsence": "CONGE" }
{ "id": 2, "typeAbsence": "OFF" }
```

Now submit a request using that `id`:

```bash
curl -s -X POST http://localhost:3000/api/absences/demande \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "idConfigAbsence": 1,
    "dateDebutAbsence": "2026-07-15",
    "dateFinAbsence":   "2026-07-17",
    "typeJournee": "JOURNEE",
    "priorite": "NORMALE",
    "motif": "Vacation"
  }' | jq .
```

### Step 4 — Test access control (403 and 401)

**Testing a 403 — logged in but no permission:**

Log in as the employee (rang3) and try to access a manager-only route:

```bash
# Get employe token
EMPLOYE_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"employe@test.mg","motDePasse":"Test1234!"}' | jq -r .data.token)

# Try a manager-only route — should return 403
curl -s http://localhost:3000/api/absences/equipe \
  -H "Authorization: Bearer $EMPLOYE_TOKEN" | jq .
```

Expected:

```json
{ "success": false, "error": "Accès refusé" }
```

**Testing a 401 — no token at all:**

```bash
curl -s http://localhost:3000/api/auth/me | jq .
```

Expected:

```json
{ "success": false, "error": "Token manquant" }
```

> **Key insight:** 401 means "I don't know who you are." 403 means "I know who you are, but you can't do that." These are two different problems.

---

## 8. Key patterns to recognize

### Pattern 1 — Happy path then edge cases

Every `describe` block tests the happy path first (the request that should succeed), then adds tests for all the ways it can fail:

```
✓ valid request  → 201
✓ duplicate      → 409
✓ missing field  → 400
✓ no token       → 401
✓ wrong role     → 403
```

### Pattern 2 — State saved between tests

Tests inside the same file share data through variables declared outside the tests:

```js
let absenceId = null; // declared at the top of the file

test('submit request → 201', async () => {
  const res = await request(app).post(...);
  absenceId = res.body.data.id; // save for next test
});

test('manager approves it → 200', async () => {
  // uses the id saved above
  const res = await request(app).patch(`/api/absences/${absenceId}/validation`...);
});
```

> **Watch out:** if the first test fails, `absenceId` stays `null`. The second test will then send a request to `/api/absences/null/validation`, which will return 404 and also fail. This is called a **cascade failure** — one broken test breaks all the tests that depend on it. When you see multiple consecutive failures, always look at the first one.

### Pattern 3 — Idempotent setup

`beforeAll` uses `findOrCreate` (not just `create`) so running the tests a second time doesn't fail because the test users already exist. The tests are **safe to run repeatedly**.

### Pattern 4 — Always clean up

`afterAll` deletes everything the tests created — created users, tasks, leave requests, etc. This prevents one test run from polluting the next one.

---

## 9. What each helper file does

### `helpers/setup.js`

The central hub. Exports:

- **`state`** — a shared object holding the 3 tokens and 3 user objects
- **`authHeader(rang)`** — returns `{ Authorization: "Bearer <token>" }` for a given level
- **`initializeTestSession()`** — creates test users + logs in all three, filling `state`
- **`app`** — the Express app instance (used by supertest to make requests without a real server)

Every test file imports these four things and calls `initializeTestSession()` in `beforeAll`.

### `helpers/seeds.js`

Creates the three test users in the database if they don't already exist:

- Hashes their passwords with bcrypt
- Sets the manager hierarchy (employe → manager → admin)
- Seeds the bonus/penalty configuration rules

This runs automatically inside `initializeTestSession()`.

### `helpers/simulateData.js`

Inserts fake attendance records directly into the database (bypasses the API). Used by `presence.test.js` and `bonus.test.js` to simulate a full month of work without making 20+ individual API calls.

Key functions:

- **`simulatePresenceMonth(userId, year, month, options)`** — inserts N days of attendance; first M days are marked as late
- **`clearPresenceData(userId, year, month)`** — removes all attendance for that month

### `helpers/teardown.js`

Closes the Sequelize database connection after all test suites complete. Without this, Jest would hang waiting for the connection to close.

---

## 10. Common failure causes and how to fix them

| Symptom                            | Likely cause                                          | Fix                                                               |
| ---------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------- |
| All tests fail immediately         | Database not running or wrong credentials in `.env` | Check `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`      |
| `rangs 1/2/3 not found` error    | Database was not seeded                               | Run `npm run db:setup`                                          |
| `config_absence is empty` error  | Seeders did not run                                   | Run `npm run db:seed`                                           |
| Login returns 401 in `beforeAll` | Test users were manually deleted                      | Run `npm run db:seed` (seeds re-create them)                    |
| One test passes, next fails        | Tests ran in parallel (not in band)                   | Always use `npm test`, never `jest` directly                  |
| `500` on a route with a filter   | Bug in service (missing import, undefined variable)   | Check the server console output for the actual error              |
| `dureeTravail = 0` on clock-out  | Entry and exit happened in the same minute            | Not a real bug — test fixture limitation; the field still exists |

---

## Quick cheat-sheet

```bash
# First-time setup
npm run db:setup

# Run all tests
npm test

# Run one module
npm run test:auth

# Start server for manual curl testing
npm run dev

# Get a token manually
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.mg","motDePasse":"Test1234!"}' | jq -r .data.token
```

---

*This guide covers the test suite at `src/__tests__/`. For the full API specification, see the source code under `src/modules/`.*
