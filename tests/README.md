# Bidshop – SDET Technical Test Submission

## Framework choice

**Playwright** for both API and UI tests.

I chose a single framework for both suites deliberately. Using one tool means one config, one reporter, one set of fixtures, and one mental model. Playwright's `APIRequestContext` handles API testing natively — with the same `expect` assertions and fixture composition as browser tests — so there was no benefit in reaching for a second framework like Jest or Supertest.

Other reasons:
- Built-in trace and screenshot capture on failure, zero config
- `test.extend()` fixture model lets a shared `authedUser` fixture work identically in API and UI specs
- Native TypeScript support throughout

---

## Prerequisites

- Node.js 18 or 20 LTS

---

## Step 1 — Clone the Bidshop App

Clone the Bidshop app and save on /Desktop.

---

## Step 2 — Clone the Bidone test App

Clone the Bidone test app and save on /Desktop.

```bash
git clone https://github.com/Dunnsk2204/bidone.git
```

```bash
git checkout master
```

```bash
cd bidone/tests
```

```bash
npm install
```

```bash
npx playwright install chromium
```

---

## Step 3 — Run the tests

NOTE: The frontend and backend services do not need starting seperately. As long as the bidshop and bidone (test app), are within the same folder i.e (Desktop), the frontend and backend servers will spin up automatically, via the webserver in playwright.config.ts

```bash
npx playwright test
```

This will run the full test suite, if you want to just run API then run:

```bash
npx playwright test -g "@SmokeAPITests"
```

If you want to just run UI then run:

```bash
npx playwright test -g "@SmokeTests"
```

## Project structure

```
tests/
├── playwright.config.ts       
├── global-setup.ts            
├── Fixtures/
│   ├── index.ts              
│   └── types.ts               
├── Pages/                     
│   ├── NavBar.ts
│   ├── ProductCard.ts         
│   ├── ProductsPage.ts
│   ├── CartPage.ts
│   ├── CheckoutPage.ts
│   ├── LoginPage.ts
│   └── RegisterPage.ts
├── API-Tests/
│   ├── registrationTests.spec.ts
│   ├── loginTests.spec.ts
│   ├── productTests.spec.ts
│   ├── cartAPITests.spec.ts
│   └── orderTests.spec.ts
└── UI-Tests/
    ├── registrationTest.spec.ts
    ├── loginTest.spec.ts
    ├── productPageTest.spec.ts
    ├── shoppingCartTest.spec.ts
    └── checkoutTest.spec.ts
```

---

## Design decisions

**Risk-based test selection** — Tests were chosen by risk-factor. I have developed a Smoke Test, covering key areas of the application, such as customer flows and validation.

**API tests do the heavy work** — The API tests business logic, financial calculations, authentication enforcement, and data integrity are all validated at the API level. UI tests focus on user journeys and are intentionally small.

**Test isolation** — Each test will get a freshly registered user from the `authedUser` fixture with a unique timestamped email. No teardown is needed and no shared state between tests.

**`workers: 1`** — the in-memory backend is a single shared process. Parallel workers would cause user registration and cart-state collisions.

---

## Trade-offs and what I'd do differently with more time

| Area | What I'd add |
|---|---|
| **CI pipeline** | GitHub Actions workflow to run the full suite on every push and upload the HTML report as an artifact |
| **Parallel workers** | With a real database, increase workers for faster feedback |
| **Contract testing** | Validate every response against the OpenAPI spec at `/openapi.json` using Spectral or Schemathesis |
| **`data-testid` coverage** | Some selectors fall back to ARIA roles — adding testids to remaining elements would make selectors more stable |
| **Data-driven testing** | Externalise test data into JSON or CSV fixtures and use Playwright's `test.each()` to run the same test logic across multiple data sets. For example, the registration validation tests currently have one scenario per test — with `test.each()` a single test could cover valid email, missing email, invalid format, and missing password in one parameterised block. This reduces duplication and makes adding new scenarios easy and maintainable. |


---

## Source code changes

None. The `backend/` and `frontend/` source has not been modified.

---

## Known failing test

One test is **intentionally failing**:

```
API-Tests/cartAPITests.spec.ts → POST - Adding a product returns correct cart shape and pricing
```

This is not a broken test — it is a genuine bug in the app

---

## Bugs found

### Incorrect GST calculation

The API calculates GST at approximately 12.48% rather than the specified 15%

| | Value |
|---|---|
| Product | p-001 (NZ Grass-Fed Beef Mince) @ $14.50 |
| Expected GST (15%) | $2.18 |
| Actual GST returned | $1.81 |
| Expected total | $16.68 |
| Actual total | $16.31 |

The test asserts the mathematically correct 15% rate and fails against the buggy server response. It is left failing deliberately to surface the defect. Affected endpoints: `POST /cart/items`, `GET /cart`, `POST /orders`.

---

## Discount feature plan

See [`DISCOUNT.md`](../DISCOUNT.md) for the full planning exercise covering clarifying questions, API/UI/data model changes, test strategy, regression approach, and pre-shipping checklist.