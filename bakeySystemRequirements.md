# Bakery Management System — Technical Requirements Document

**Stack:** Node.js, Express, MongoDB, Mongoose, Redis (caching)
**Architecture:** Layered (routes → validators → controllers → models), with shared factory controllers for standard CRUD
**Payment Gateway:** Kashier (card payments), Cash on Delivery (COD)

---

## 1. Overview

A backend platform digitizing the full lifecycle of a bakery business: product browsing, cart, checkout, payment, fulfillment (baking + delivery/pickup), and post-purchase engagement (reviews, wishlist, promotions). The system is role-based, with a real multi-stage order lifecycle and inventory that reacts to sales.

Built in three phases — Core Business, Complete the Transaction, Growth & Insight — all three now complete.

---

## 2. Roles & Permissions

| Role                  | Can do                                                                                                                                                                                                           |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Customer**          | Register/login, browse products without an account, place orders, pay online or COD, track own orders, leave reviews on purchased products, manage wishlist, apply coupons                                       |
| **Admin**             | Full product/category management, create employee accounts (baker/delivery), assign delivery employees to orders, moderate reviews, manage coupons and seasonal offers, view audit logs, view business dashboard |
| **Baker**             | View assigned orders, mark orders `preparing` → `ready`                                                                                                                                                          |
| **Delivery Employee** | View only their own assigned deliveries, update delivery progress, mark `out_for_delivery` → `delivered`/`picked_up`                                                                                             |

### Role rules

- Only admins can create baker/delivery accounts — they do not self-register.
- Admins are not created through public signup.
- A delivery employee's queries are always scoped to `assignedDeliveryId === self` — enforced at the query level, not just the route/UI level.

---

## 3. Functional Requirements

### 3.1 Customer

- FR-1: Browse and search the product catalog without authentication.
- FR-2: Register/login required only to place an order, review, or use wishlist/cart.
- FR-3: Add a product to cart, selecting a size where applicable; price is resolved server-side (never trusted from the client) and includes any active seasonal offer discount at the moment of adding.
- FR-4: View, update quantity, or remove items from own cart.
- FR-5: Apply a coupon code at checkout; discount is validated server-side before being reflected in the order total.
- FR-6: Choose payment method at checkout: online card payment (via Kashier hosted session) or Cash on Delivery.
- FR-7: Choose delivery method: home delivery or store pickup.
- FR-8: Cancel an order, only while its status is still `pending`.
- FR-9: View own order history and current status of each order.
- FR-10: Leave a review (rating 1–5, optional comment) on a product, restricted to products from a completed order (`paymentStatus: paid` AND `status` in `delivered`/`picked_up`).
- FR-11: Edit or delete own review.
- FR-12: Add/remove products to/from a personal wishlist; move a wishlisted item directly into the cart (removing it from the wishlist in the same action).

### 3.2 Baker

- FR-13: View the list of orders assigned for preparation.
- FR-14: Mark an assigned order `preparing`, then `ready`. Each transition is recorded in the order's `statusHistory` with who made the change and when.

### 3.3 Delivery Employee

- FR-15: View only deliveries assigned specifically to this employee (`assignedDeliveryId`).
- FR-16: Update delivery progress: `out_for_delivery` → `delivered`. For pickup orders, mark `picked_up` instead.

### 3.4 Admin

- FR-17: Create, update, delete products and categories.
- FR-18: Create baker and delivery employee accounts.
- FR-19: Assign a delivery employee to a `ready` order.
- FR-20: Moderate (delete) any customer review.
- FR-21: Create, update, delete coupons.
- FR-22: Create, update, delete seasonal offers, targeting either specific products, an entire category, or both.
- FR-23: View all admin actions in a centralized audit log (create employee, delete product, update product, delete review, create/update/delete coupon, create/update/delete seasonal offer).
- FR-24: View business dashboard: revenue summary, sales-over-time (daily/weekly/monthly), best-selling products, order status summary, average order value, new-customer growth over time, top-rated products, count of currently active seasonal offers.

---

## 4. Core Workflow

```
Customer browses products (prices reflect any live seasonal offer)
        │
        ▼
Adds items to cart (server resolves size + offer-discounted price)
        │
        ▼
Checks out — applies coupon (optional), chooses payment method
        │
        ▼
   ┌────┴─────┐
   │          │
  COD      Card (Kashier)
   │          │
   │     Cart snapshotted into PendingOrder
   │     Kashier hosted session created
   │          │
   │     Customer pays on Kashier's page
   │          │
   │     Kashier webhook fires (HMAC-signature verified)
   │          │
   │     Order created from PendingOrder snapshot,
   │     stock decremented atomically (transaction)
   │          │
   └────┬─────┘
        ▼
Order created (status: pending)
        │
        ▼
Admin/system accepts → Baker prepares (preparing → ready)
        │
        ▼
Admin assigns delivery employee (if home delivery)
        │
        ▼
Delivery employee delivers (out_for_delivery → delivered)
   OR customer picks up in-store (picked_up)
        │
        ▼
Order is "completed" once paymentStatus: paid AND status: delivered/picked_up
        │
        ▼
Customer may now review purchased products
```

An order may be **cancelled** only while `status: pending`. Once accepted, it is committed — kitchen/delivery staff are already acting on it.

---

## 5. Data Model

### 5.1 `Product`

| Field           | Type                                                | Required    | Notes                                                     |
| --------------- | --------------------------------------------------- | ----------- | --------------------------------------------------------- |
| `name`          | String                                              | Yes         | Unique, trimmed                                           |
| `description`   | String                                              | No          |                                                           |
| `price`         | Number                                              | Conditional | Used only when the product has no sizes                   |
| `imageUrl`      | String                                              | No          |                                                           |
| `categoryId`    | ObjectId ref `Category`                             | Yes         |                                                           |
| `sizes`         | [{ name: enum(small/medium/large), price: Number }] | No          | Used when the product has sizes instead of a flat `price` |
| `stockQuantity` | Number                                              | Yes         | Min 0                                                     |
| `isAvailable`   | Boolean                                             | Auto        | Computed on save: `stockQuantity > 0`                     |
| `soldQuantity`  | Number                                              | Auto        | Incremented on fulfillment                                |
| `createdBy`     | ObjectId ref `User`                                 | Yes         |                                                           |

### 5.2 `Cart`

| Field            | Type                                   | Notes                                                                                                          |
| ---------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `userId`         | ObjectId ref `User`                    | One active cart per user                                                                                       |
| `cartItems`      | [{ productId, size, price, quantity }] | `price` is a **snapshot** resolved at add-time (size price + any active offer discount), not recalculated live |
| `totalCartPrice` | Number                                 | Recomputed on every cart mutation                                                                              |

### 5.3 `Order`

| Field                                                        | Type                                       | Notes                                                                                                  |
| ------------------------------------------------------------ | ------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| `user`                                                       | ObjectId ref `User`                        | Required                                                                                               |
| `cartItems`                                                  | [{ product, name, quantity, size, price }] | Snapshotted at order-creation time — immune to later product renames/price changes                     |
| `assignedBakerId`                                            | ObjectId ref `User`                        | Nullable                                                                                               |
| `assignedDeliveryId`                                         | ObjectId ref `User`                        | Nullable                                                                                               |
| `status`                                                     | enum                                       | `pending`, `accepted`, `preparing`, `ready`, `out_for_delivery`, `delivered`, `cancelled`, `picked_up` |
| `statusHistory`                                              | [{ status, changedBy, changedAt }]         | Full audit trail of the order's own lifecycle — separate from the system-wide `AuditLog`               |
| `itemsPrice`, `taxPrice`, `shippingPrice`, `totalOrderPrice` | Number                                     |                                                                                                        |
| `deliveryMethod`                                             | enum                                       | `delivery` \| `pickup`                                                                                 |
| `deliveryAddress`                                            | { governorate, city, street, zipCode }     | Only when `deliveryMethod: delivery`                                                                   |
| `kashierTransactionId`                                       | String                                     | Unique, sparse — only set for card payments                                                            |
| `paymentStatus`                                              | enum                                       | `pending`, `paid`, `failed`, `refunded`                                                                |
| `paymentMethod`                                              | enum                                       | `cash` \| `card`                                                                                       |
| `paidAt`, `deliveredAt`, `pickedUpAt`                        | Date                                       | Nullable timestamps                                                                                    |

### 5.4 `PendingOrder` (transient — Kashier checkout only)

| Field                                                                  | Type   | Notes                                                                                                                               |
| ---------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `merchantOrderId`                                                      | String | `${userId}_${timestamp}` — links a Kashier session to a checkout attempt                                                            |
| `user`, `deliveryMethod`, `deliveryAddress`, `cartItems`, `itemsPrice` | —      | Cart snapshot taken at the moment of Kashier session creation, so a later webhook never depends on the live (possibly-changed) cart |

Deleted once successfully converted into a real `Order`.

### 5.5 `FailedOrder`

| Field                                         | Type    | Notes                                                                                                               |
| --------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------- |
| `transactionId`                               | String  | The Kashier transaction that succeeded in payment but failed order fulfillment (e.g. stock ran out mid-transaction) |
| `merchantOrderId`, `user`, `amount`, `reason` | —       |                                                                                                                     |
| `refunded`                                    | Boolean | Whether the automatic refund attempt succeeded                                                                      |

Exists so a paid-but-unfulfillable order is never silently lost, and duplicate webhook deliveries don't trigger duplicate refunds.

### 5.6 `Wishlist`

| Field     | Type                   | Notes       |
| --------- | ---------------------- | ----------- |
| `user`    | ObjectId ref `User`    |             |
| `product` | ObjectId ref `Product` |             |
| `addedAt` | Date                   | Default now |

Unique compound index on `(user, product)` — enforced at the database level, prevents duplicate wishlisting.

### 5.7 `Review`

| Field     | Type                   | Notes    |
| --------- | ---------------------- | -------- |
| `user`    | ObjectId ref `User`    |          |
| `product` | ObjectId ref `Product` |          |
| `rating`  | Number                 | 1–5      |
| `comment` | String                 | Optional |

Unique compound index on `(user, product)` — one review per user per product. Eligibility (must have a completed order containing this product) is enforced at the validator layer, not stored on the review itself.

### 5.8 `Coupon`

| Field      | Type   | Notes              |
| ---------- | ------ | ------------------ |
| `name`     | String | Unique, uppercased |
| `expire`   | Date   | Required           |
| `discount` | Number | 1–100 (percentage) |

> **Known limitation:** no usage tracking exists — the model does not record how many times a coupon has been used, nor does `Order`/`Cart` store which coupon (if any) was applied to a given purchase. Only the final discounted price is retained. Coupon usage analytics are explicitly out of scope until this is added.

### 5.9 `SeasonalOffer`

| Field                                | Type                     | Notes                                                                     |
| ------------------------------------ | ------------------------ | ------------------------------------------------------------------------- |
| `name`, `description`, `bannerImage` | String                   |                                                                           |
| `discountPercentage`                 | Number                   | 1–100                                                                     |
| `startDate`, `endDate`               | Date                     | `endDate` must be after `startDate`                                       |
| `products`                           | [ObjectId ref `Product`] | Optional                                                                  |
| `category`                           | ObjectId ref `Category`  | Optional                                                                  |
| `isActive`                           | Boolean                  | Default true — admin manual pause switch, distinct from date-based expiry |

At least one of `products` or `category` is required. Discount pricing is **never stored on `Product`** — it is computed live on every read by checking whether `now` falls within `[startDate, endDate]` and `isActive: true`. This guarantees automatic expiry with no cron job and no stale-data risk.

### 5.10 `AuditLog`

| Field        | Type                | Notes                                                                                                                                                                                                 |
| ------------ | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `admin`      | ObjectId ref `User` | Who performed the action                                                                                                                                                                              |
| `action`     | enum                | `CREATE_EMPLOYEE`, `DELETE_PRODUCT`, `UPDATE_PRODUCT`, `CREATE_PRODUCT`, `DELETE_REVIEW`, `CREATE_COUPON`, `UPDATE_COUPON`, `CREATE_SEASONAL_OFFER`, `UPDATE_SEASONAL_OFFER`, `DELETE_SEASONAL_OFFER` |
| `targetType` | String              | e.g. `"Product"`, `"Review"`, `"SeasonalOffer"`                                                                                                                                                       |
| `targetId`   | ObjectId            | The affected document's id                                                                                                                                                                            |
| `details`    | Mixed               | Freeform — shape varies per action type (e.g. `{ changes: {...} }` for updates)                                                                                                                       |

Scope is deliberately limited to **admin actions with lasting consequences outside the normal order workflow**. Routine order-status progression (baker/delivery marking their own steps) is intentionally excluded — that lifecycle is already fully captured in `Order.statusHistory`, and duplicating it here would be redundant.

---

## 6. Key Business Rules

- **BR-1:** A product with `stockQuantity: 0` (`isAvailable: false`) cannot be added to a cart or order.
- **BR-2:** Stock is decremented atomically (MongoDB transaction) at order-fulfillment time, guarding against overselling when concurrent payments race for the same limited stock.
- **BR-3:** An order's payment is only ever marked `paid` after a cryptographically-verified webhook confirmation from Kashier (HMAC-SHA256 signature check) — never assumed from client-side redirect alone.
- **BR-4:** The cart is snapshotted into a `PendingOrder` at the moment a Kashier session is created, so a webhook arriving minutes later fulfills against what the customer actually agreed to pay for, not whatever the live cart happens to contain by then.
- **BR-5:** Webhook processing is idempotent: a duplicate webhook delivery for an already-fulfilled `kashierTransactionId` is a no-op. A duplicate refund for an already-logged `FailedOrder` is also a no-op.
- **BR-6:** If payment succeeds but order fulfillment fails (e.g., stock sold out in the gap between payment and confirmation), the payment is automatically refunded, and the failure is logged to `FailedOrder` regardless of refund outcome — a refund failure is logged as `CRITICAL` for manual review, never silently dropped.
- **BR-7:** Only a customer with a completed order (`paymentStatus: paid` AND `status` in `delivered`/`picked_up`) containing a given product may review that product.
- **BR-8:** A delivery employee may only view/update deliveries where `assignedDeliveryId` equals their own id — enforced in the query itself, not only the route guard.
- **BR-9:** Once cancelled, an order is final — no further edits or status transitions are permitted.
- **BR-10:** A seasonal offer's discount is computed live at read time (product display, cart addition) from `SeasonalOffer.startDate/endDate/isActive` — never cached into `Product` or persisted as a mutated price. This is intentional: it guarantees the discount disappears automatically the instant `endDate` passes, with no synchronization job required.
- **BR-11:** The price a customer sees while browsing a product and the price recorded in their cart when they add it must be identical — both derive from the exact same offer-lookup + size-resolution logic, applied at the same point in each flow.
- **BR-12:** Once a price is snapshotted into a `Cart` item, it does not change even if the underlying offer expires or a new one begins while the item sits in the cart — the customer's agreed price is locked at add-time.
- **BR-13:** Meaningful admin actions (see `AuditLog.action` enum) are logged with who performed them and when; routine staff workflow actions already covered by `Order.statusHistory` are not duplicated into `AuditLog`.
- **BR-14:** The product list/detail cache (Redis, keyed by query + filters) must be invalidated whenever a `SeasonalOffer` is created, updated, or deleted — because cached product responses embed offer-derived pricing, not just raw product data. Natural expiry via `endDate` passing is not covered by this invalidation and is instead bounded by cache TTL.
- **BR-15:** "Completed order," used consistently as the qualifying condition for reviews and for all dashboard revenue/sales metrics, means `paymentStatus: paid` AND `status` in `{delivered, picked_up}`.

---

## 7. Dashboard Metrics (Admin)

| Endpoint                     | Aggregation basis                                                                                               | Time-series?          |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------- |
| Revenue summary              | `Order`, filtered to completed orders, optionally scoped by range (`today`/`week`/`month`/`all`)                | No — single total     |
| Sales over time              | Same filter, grouped by day via `$dateToString`                                                                 | Yes                   |
| Best-selling products        | Completed orders, `$unwind` on `cartItems`, grouped by product, sorted by quantity sold                         | No (snapshot ranking) |
| Order status summary         | **All** orders regardless of payment/date — an operational snapshot of the current pipeline, not a sales metric | No                    |
| Average order value          | Completed orders, `$avg` on `totalOrderPrice`                                                                   | No                    |
| New customers over time      | `User` collection, `role: customer`, grouped by signup date                                                     | Yes                   |
| Top-rated products           | `Review` collection, `$avg` rating per product, joined to `Product` for display name                            | No                    |
| Active seasonal offers count | `SeasonalOffer`, live date-range check (no stored flag)                                                         | No                    |

> **Deliberately excluded:** coupon usage statistics — `Coupon` has no usage tracking and no order retains which coupon was applied, so this metric cannot currently be computed from stored data.

---

## 8. Explicitly Out of Scope

- Coupon usage tracking / analytics (no `usedCount`, no `couponUsed` reference on `Order`)
- Notifications (order status changes, promotions) — deferred to Future Enhancements
- Loyalty points, gift cards, product recommendations
- Real-time order tracking (live push updates, as opposed to polling)
- Email/SMS notifications
- Multi-branch bakery support
- Sales forecasting, ingredient-level inventory, supplier management
- Automatic invoice generation
- AI-powered sales analytics

---

## 9. Notable Engineering Patterns Used

- **Snapshot-then-fulfill:** cart/product data is copied at the moment of commitment (checkout, add-to-cart) rather than re-read live at every later step — protects against the underlying data changing mid-flow.
- **Ack-then-process webhook handling:** Kashier webhook responds `200` immediately, then performs fulfillment — avoids gateway timeout/retry storms while still doing the real work.
- **Live-computed pricing over denormalized fields:** seasonal offer discounts are never stored on `Product`; they're computed at read time from the offer's own date range. Avoids stale-data bugs and cron-job dependency entirely.
- **Two-layer idempotency:** `Order` lookup by `kashierTransactionId` prevents duplicate fulfillment; `FailedOrder` lookup prevents duplicate refunds.
- **Cache invalidation tied to the actual data dependency, not just the obvious model:** the product cache is invalidated not only on product changes but also on seasonal offer changes, since cached product responses are a function of both.
