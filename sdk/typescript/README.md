# @postware/sdk

Typed TypeScript client for a workspace served by the Postware API. The types in `src/types.ts` are generated from the compiled standard; `src/client.ts` is hand-written.

```ts
import { Postware } from "@postware/sdk";

const a = new Postware({ baseUrl: process.env.POSTWARE_URL!, workspace: "acme", token: process.env.POSTWARE_API_KEY });

// records, typed per model
const page = await a.person.query({ where: { "emails.value": "jane@example.com" }, limit: 10 });
const jane = page.data[0] ?? (await a.person.create({ name: { full: "Jane Doe" }, emails: [{ value: "jane@example.com" }] }));
await a.person.update(jane.id, { locale: "en" }, { ifMatch: jane.revision });
const { record, created } = await a.person.upsert({ name: { full: "Jane Doe" }, emails: [{ value: "jane@example.com" }] });

// batch, search, schema
await a.batch([{ op: "create", model: "task", data: { title: "Call Jane", status: { category: "open" } } }], { atomic: true });
const hits = await a.search("acme", { models: ["organization", "person"] });
const schema = await a.schema.get("invoice");

// end users: magic link
await a.auth.magicLink.request("jane@example.com", "https://app.example.com/callback");
a.auth.magicLink.handleCallback(); // on the callback page: stores #access_token and #refresh_token
await a.auth.refresh();

// events over SSE
const stop = a.events.subscribe(0, (e) => console.log(e.event, e.model, e.id));

// public and share reads
const docs = await a.public("acme").document.query({ where: { "status.category": "published" } });
const shared = await a.shareLink(process.env.SHARE_TOKEN!).invoice.query({});
```

Every model is a property (`a.person`, `a.invoice`, `a.share`, `a.workspace`, ...; `a.records(name)` for dynamic names), so the client's own members avoid those names: `workspaceSlug`, `public(ws)`, `shareLink(token)`, `batch`, `search`, `me`, `stats`, `schema`, `auth`, `events`, `files`, `imports`, `exports`, `shares`, `webhooks`.

Errors are `PostwareError { status, code, message, details }`. Every `where` key is checked against the model's paths at compile time; `ext.<namespace>.<name>` is always allowed.

## Rules for agents

1. Read the schema (`a.schema.get(name)`) before writing: identity rules and status categories decide what `upsert` and `status` accept.
2. Pass `ifMatch` from the record you read; a `conflict` error means someone changed it: read again.
3. Never store credentials in records. End users sign in through the magic link flow; the SDK keeps the tokens.
4. Prefer `upsert` over `create` for anything with an identity rule (people by email, organizations by domain).
