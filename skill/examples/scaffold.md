# Scaffold walkthrough

A product with end-user sign-in, plans and charges, on `@postware/sdk`. Environment: `A_URL`, `A_WORKSPACE`, `A_TOKEN` (an API key of an agent Member for server-side code; end users get their own tokens through the magic link flow).

## Server side: one client per request

```ts
import { Postware } from "@postware/sdk";

export const admin = new Postware({
  baseUrl: process.env.A_URL!,
  workspace: process.env.A_WORKSPACE!,
  token: process.env.A_TOKEN!, // an API key; acts as its Member
});

// A client acting as the signed-in end user (its access token from the browser).
export function asUser(accessToken: string) {
  return new Postware({ baseUrl: process.env.A_URL!, workspace: process.env.A_WORKSPACE!, token: accessToken });
}
```

## Sign-in: the magic link flow

```ts
// login page
await a.auth.magicLink.request(email, `${origin}/auth/callback`);

// callback page: the server redirected to /auth/callback#access_token=...&refresh_token=...
const tokens = a.auth.magicLink.handleCallback();
if (tokens) router.push("/app");

// later, when a call fails with unauthorized
try { await a.me(); } catch (e) { if (e instanceof PostwareError && e.status === 401) await a.auth.refresh(); }
```

The end user is a Person. `await a.me()` returns the principal and its Person record. The pack policies let it read and update its own Person and read its own Invoices, Subscriptions, Payments and Tickets.

## Plans: Products and Prices

```ts
const pro = await admin.product.upsert({
  name: "Pro",
  kind: "service",
  active: true,
  identifiers: [{ system: "sku", value: "plan-pro" }],
});
const proMonthly = await admin.price.upsert({
  product: { model: "product", id: pro.record.id },
  amount: { amount: "29.00", currency: "USD" },
  interval: "month",
  usage_based: false,
  active: true,
  nickname: "pro-monthly",
});
```

## A subscription and its first invoice

```ts
const person = (await admin.person.query({ where: { "emails.value": email } })).data[0]!;

const sub = await admin.subscription.create({
  direction: "receivable",
  counterparty: { model: "person", id: person.id },
  items: [{ price: { model: "price", id: proMonthly.record.id }, quantity: "1" }],
  status: { category: "active" },
  current_period: { start: periodStart, end: periodEnd },
  started_at: periodStart,
});

const invoice = await admin.invoice.create({
  number: "INV-0001",
  direction: "receivable",
  counterparty: { model: "person", id: person.id },
  status: { category: "open" },
  issued_at: today,
  due_at: today,
  currency: "USD",
  tax_inclusive: false,
  lines: [{ description: "Pro, monthly", quantity: "1", unit_price: { amount: "29.00", currency: "USD" }, amount: { amount: "29.00", currency: "USD" } }],
  subtotal: { amount: "29.00", currency: "USD" },
  tax_total: { amount: "0.00", currency: "USD" },
  total: { amount: "29.00", currency: "USD" },
  amount_paid: { amount: "0.00", currency: "USD" },
  amount_due: { amount: "29.00", currency: "USD" },
  subscription: { model: "subscription", id: sub.id },
});
```

## A payment that settles it

```ts
await admin.payment.create({
  direction: "incoming",
  counterparty: { model: "person", id: person.id },
  amount: { amount: "29.00", currency: "USD" },
  received_at: new Date().toISOString(),
  method: "card",
  status: "succeeded",
  applied: [{ invoice: { model: "invoice", id: invoice.id }, amount: { amount: "29.00", currency: "USD" } }],
  identifiers: [{ system: "stripe:payment_intent", value: "pi_123" }],
});
await admin.invoice.update(
  invoice.id,
  { status: { category: "paid" }, paid_at: new Date().toISOString(), amount_paid: { amount: "29.00", currency: "USD" }, amount_due: { amount: "0.00", currency: "USD" } },
  { ifMatch: invoice.revision },
);
// emits invoice.paid on the event stream and to webhooks
```

## Seeding a pipeline and a docs collection

```ts
await admin.batch(
  [
    { op: "upsert", model: "pipeline", data: { name: "Sales", default: true, stages: [
      { key: "lead", label: "Lead", category: "open", order: 1 },
      { key: "qualified", label: "Qualified", category: "open", order: 2, probability: "0.3" },
      { key: "won", label: "Won", category: "won", order: 3 },
      { key: "lost", label: "Lost", category: "lost", order: 4 },
    ] } },
    { op: "upsert", model: "collection", data: { name: "Docs", slug: "docs", kind: "docs", public: true } },
  ],
  { atomic: true, dryRun: true }, // validate first
);
```

Run the same batch with `dryRun: false` once it validates. Published Documents in a public Collection are readable without a token at `GET {A_URL}/p/{workspace}/document`.
