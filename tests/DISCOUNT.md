# Discount Feature Plan
> **Feature:** Give customers a 10% discount on any order with a subtotal over NZD $100.

---

## 1. Clarifying questions

Before writing any code, I'd ask the product owner and dev team this:

**Business rules**
- Is the $100 threshold applied to the **subtotal** (pre-GST) or the **GST-inclusive total**? This matters because $100 subtotal = $115 incl. GST at the current rate.
- Is the discount applied **before or after GST** is calculated? The order of operations changes the final amount: `subtotal → discount → GST` vs `subtotal → GST → discount`.
- Is the threshold **greater than** $100, or **greater than or equal to** $100? The boundary behaviour at exactly $100.00 needs to be explicit.
- Does the discount apply to **all customers**, or only registered/logged-in users?

**Edge cases**
- What happens if a customer edits their cart after qualifying — e.g. removes an item to drop below $100? Does the discount disappear in real time?
- Does the discount apply to out-of-stock or back-ordered products?
- Can a customer fake the discount by splitting orders up?

**Operational**
- Is this a **permanent** feature or a **time-limited** promotion? If time-limited, we need start/end dates in the data model.
- Do we need an **admin toggle** to enable/disable it without a deployment?
---

## 2. Changes required

### Data model

Add discount fields to the `Order` object and a preview field to the `Cart` response:

```typescript
interface Cart {
  // existing fields...
  estimatedDiscount: number;  // 0 or 10% of subtotal — shown before checkout
}

interface Order {
  // existing fields...
  discountApplied: boolean;   // was the threshold met?
  discountAmount: number;     // 0 or 10% of subtotal
  gst: number;                // calculated on (subtotal - discountAmount)
  total: number;              // subtotal - discountAmount + gst
}
```

### API changes

- **`GET /cart`** — add `estimatedDiscount` to the totals response so the UI can preview the saving before checkout
- **`POST /orders`** — apply discount logic in order creation:
  1. Calculate `subtotal`
  2. If `subtotal > 100`: set `discountAmount = subtotal * 0.10`
  3. Calculate `gst` on `(subtotal - discountAmount)`
  4. Persist `discountApplied` and `discountAmount` on the Order record
- **`GET /orders/:id`** and **`GET /orders`** — return the new discount fields

### UI changes

- **Cart summary** — show a "You qualify for a 10% discount!" banner when subtotal exceeds $100, with the estimated saving amount
- **Cart totals** — add a Discount line item between Subtotal and GST when applicable
- **Checkout confirmation** — display the discount amount that was applied
- **Order history** — surface the discount on order detail pages

---

## 3. Test strategy

### API tests (primary — where business logic lives)

| Scenario | Expected result |
|---|---|
| Order subtotal = $99.99 | No discount — `discountApplied: false`, `discountAmount: 0` |
| Order subtotal = $100.00 | Depends on GT vs GTE clarification |
| Order subtotal = $100.01 | 10% discount applied — totals correct |
| Order subtotal = $200.00 | `discountAmount: $20.00`, GST on $180, `total: $207.00` |
| Cart subtotal > $100 | `estimatedDiscount` field present and correct |
| Cart subtotal < $100 | `estimatedDiscount: 0` |

All financial assertions use `toBeCloseTo(value, 2)` to handle floating-point rounding.

### UI tests (user-visible behaviour only)

| Scenario | Assertion |
|---|---|
| Cart below threshold | No discount banner visible |
| Cart crosses threshold | Banner appears with correct saving amount |
| Item removed to drop below threshold | Banner disappears |
| Checkout confirmation | Discount amount shown on screen |

---

## 4. Validating existing behaviour isn't broken

- Run the **full existing test suite unchanged** after the feature lands. Every existing test uses low-value single-item carts that won't trigger the $100 threshold, so they should all continue to pass without modification.
- The discount logic should live in a **pure function** (`applyDiscount(subtotal: number): number`) so it can be tested in complete isolation from the order flow.
- Add a **contract test** against the OpenAPI spec to ensure `discountApplied` and `discountAmount` are documented and present on every order response

---

## 5. Before shipping

- [ ] Confirm all clarifying question answers with the product owner — especially GT vs GTE and the GST calculation order
- [ ] Update the OpenAPI spec (`/openapi.json`) with the new fields **before** any code lands — spec-first prevents consumer surprises
- [ ] Add a feature flag (e.g. `DISCOUNT_ENABLED=true` env var) so the feature can be toggled without a deployment
- [ ] QA sign-off on boundary values: $99.99, $100.00, $100.01