# 🥐 Bakery Management System API

## Business Overview

The **Bakery Management System** is a backend platform that digitizes the full lifecycle of a bakery business — from a customer browsing products online to that product being baked, packaged, and delivered to their door.

Most portfolio projects simulate a store. This project simulates a **business**: it has staff with different responsibilities, a real order lifecycle with multiple stages, inventory that reacts to sales, and administrative oversight over everything that happens. The goal is not just to store and retrieve data, but to model how a bakery actually operates day to day.

This document describes the business itself — its people, its rules, and its processes — and then translates that business into a **phased engineering roadmap**, so the system can be built incrementally, tested at each stage, and never left half-finished.

---

## Why This Project

A bakery is a good business to model because it naturally requires:

- **Multiple types of users** with different permissions and different jobs (customer, admin, baker, delivery).
- **A real workflow with state**, not just a list of items — an order moves through stages, and each stage has rules about who can change it and when.
- **Inventory that is affected by sales**, requiring the system to keep data consistent instead of just storing isolated records.
- **Money changing hands**, which forces careful thinking about what "done" means for an order (is it done when paid? when delivered? when both?).

Building this system end-to-end demonstrates the ability to design software around a real business process — not just wire up CRUD endpoints.

---

## The People of the Business

| Role                  | Who They Are                                         | What They Do                                                                             |
| --------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| **Customer**          | The public. Anyone visiting the bakery's storefront. | Browse products, place orders, pay, track deliveries, leave reviews.                     |
| **Admin**             | Bakery owner / manager.                              | Runs the business: manages products, staff, orders, promotions, and reviews performance. |
| **Baker**             | Kitchen staff.                                       | Prepares the food behind each order, marks orders ready.                                 |
| **Delivery Employee** | Drivers / couriers.                                  | Delivers finished orders to customers, updates delivery progress.                        |

Each role only sees and does what's relevant to their job. A baker never sees payment details. A delivery employee never sees the full customer database. An admin sees everything, because they're accountable for the whole business.

---

## How the Business Runs (The Core Workflow)

```
Customer browses products
        │
        ▼
Adds items to cart
        │
        ▼
Checks out & chooses payment method
        │
        ▼
Order is created (status: Pending)
        │
        ▼
Admin accepts the order (status: Accepted)
        │
        ▼
Baker prepares the order (status: Preparing → Ready)
        │
        ▼
Order is handed to delivery OR customer picks it up
        │
        ▼
Delivery employee delivers it (status: Out For Delivery → Delivered)
        │
        ▼
Order Completed
```

An order can also be **Cancelled** while still Pending — once it moves past that point, it's committed, because the kitchen and delivery staff are already acting on it.

---

## Business Rules

These are the non-negotiable rules the system must always enforce, regardless of which phase is being built:

1. Customers can browse the product catalog without logging in — there is no reason to gate window-shopping behind an account.
2. An account is required the moment someone wants to actually place an order.
3. Only admins can create employee accounts (bakers and delivery staff don't self-register).
4. Only admins can manage products and categories.
5. A product that is out of stock cannot be added to an order.
6. Inventory decreases automatically the moment an order is successfully placed — stock and orders must never drift out of sync.
7. Only a customer who actually purchased a product may leave a review for it (no reviewing products you've never bought).
8. Once an order is cancelled, it's final — it cannot be edited or revived.
9. A delivery employee can only see and update deliveries assigned specifically to them, never someone else's.
10. If an order is paid online, the payment must be confirmed successful before the order is treated as paid — no assuming success.
11. Meaningful admin actions (deleting a product, changing an order's status manually, creating an employee) are logged, so there's always a record of who did what.

---

## Payments & Delivery

**Payment methods:**

- Online payment
- Cash on Delivery (COD)

**Payment states:** Pending → Paid / Failed / Refunded

**Delivery methods:**

- Home delivery
- Store pickup

Keeping these as explicit, separate concerns (rather than folding them into "order status") matters because a customer could, for example, pick up an order in person that they already paid for online — payment and fulfillment are two different timelines that happen to intersect.

---

## Roadmap Philosophy

Everything above describes the _finished_ business. Building it all at once is how projects stall out. Instead, this system is built in **three phases**, each one a fully working, demonstrable product on its own — not a fragment that only makes sense once everything else exists.

The guiding rule for phase order: **build what makes the business function first, then what makes it convenient, then what makes it competitive.**

---

## Phase 1 — Core Business (MVP)

**Goal:** A working bakery. Someone can create an account, browse real products, order them, and the order gets acknowledged. If the project stopped after this phase, it would still be a legitimate, demoable product.

**In scope:**

- Authentication & authorization (customer, admin, baker, delivery roles)
- Sign in with Google (OAuth), alongside standard email/password — same account system, just a second way in
- Product management (admin: create/update/delete; everyone: browse/search/filter)
- Category management
- Shopping cart (add, update, remove items)
- Order placement and the core status lifecycle: `Pending → Accepted → Preparing → Ready`
- Baker workflow: view assigned orders, mark preparing, mark ready
- Basic inventory tracking (stock decreases on order, blocked when out of stock)

**Explicitly out of scope for Phase 1:**

- Payments (orders can be created without a real payment step yet — assume COD by default)
- Delivery assignment and tracking
- Reviews, wishlist, coupons, dashboards, audit logs

**Why this scope:** These are the pieces without which nothing else makes sense. There's no point building a delivery-tracking feature for orders that can't yet be reliably created and prepared.

---

## Phase 2 — Complete the Transaction

**Goal:** Money and delivery. Phase 1 proved the business works; Phase 2 makes it real — customers can actually pay, and their food actually reaches them.

**In scope:**

- Real payment gateway integration (e.g. Stripe/PayPal) for online payment, plus COD, with proper payment status tracking (Pending / Paid / Failed / Refunded)
- Webhook handling so payment confirmation comes from the gateway itself, not just trusted from the client
- Enforcing the business rule that online-paid orders require confirmed payment before moving forward
- Delivery module: admin assigns a delivery employee to an order
- Delivery employee workflow: view assigned deliveries, update progress, mark delivered
- Full order lifecycle completed: `Ready → Out For Delivery → Delivered`
- Store pickup as an alternative to delivery
- Order cancellation flow (only while still Pending)

**Why this scope:** This is the point where the system stops being a demo and starts being something you could hand to an actual small bakery. A business isn't complete until money and fulfillment are handled end-to-end.

---

## Phase 3 — Growth & Insight

**Goal:** The features that make the business easier to run and more competitive — not required to function, but what separates a functional system from a well-run one.

**In scope:**

- Product reviews & ratings (restricted to verified purchasers)
- Wishlist (save products, move to cart later)
- Promotional coupons (code validation, expiry, usage limits, applied at checkout before payment)
- Seasonal offers
- Admin dashboard & business statistics (sales over time, best-selling products, order volume, etc.)
- Audit logs for administrative actions
- Notifications (order status changes, promotions)

**Why this scope:** Every one of these features assumes Phases 1 and 2 already work correctly. A coupon is meaningless without a working checkout; a dashboard is meaningless without real order history to analyze.

---

## Future Enhancements (Beyond Phase 3)

Ideas worth exploring once the core product is solid, listed here so they're not forgotten but also don't distract from the roadmap above:

- Loyalty points system
- Gift cards
- Product recommendations
- Real-time order tracking (live status updates, not just polling)
- Email and SMS notifications
- Multi-branch bakery support
- Sales forecasting
- Ingredient-level inventory management
- Supplier management
- Automatic invoice generation
- AI-powered sales analytics

---

## Order Status Reference

```
Pending  →  Accepted  →  Preparing  →  Ready  →  Out For Delivery  →  Delivered

Pending  →  Cancelled   (only valid before Accepted)
```

## Payment Status Reference

```
Pending  →  Paid
Pending  →  Failed
Paid     →  Refunded
```

---

## Summary Table — Phases at a Glance

| Phase                            | Focus                                                 | Delivers                                                                             |
| -------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **1 — Core Business**            | Can the bakery take and prepare an order at all?      | Auth (incl. Google sign-in), products, cart, orders, baker workflow, basic inventory |
| **2 — Complete the Transaction** | Can the bakery get paid and get food to the customer? | Payment gateway integration, delivery assignment & tracking, cancellations           |
| **3 — Growth & Insight**         | Can the bakery grow and understand itself?            | Reviews, wishlist, coupons, dashboard, audit logs, notifications                     |

---

## Project Purpose

This project exists to demonstrate the ability to design and build a backend system around a real business process — with proper role-based access control, a meaningful state lifecycle, and a development plan that ships working value at every stage rather than one giant feature all at once.

---

## License

This project is developed for educational and portfolio purposes.
