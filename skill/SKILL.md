---
name: start-a-company-on-postware
description: Start a company on Postware. Use when a user wants to create or connect a Postware workspace, read its schema, add the MCP server to a coding agent, scaffold a product on @postware/sdk (end users as Persons signing in by magic link, plans as Products and Prices, charges as Invoices and Payments), or seed Pipelines, Collections and Documents. Works in Claude Code and Cursor.
---

# Start a company on Postware

Postware is an open standard of business data models (Person, Organization, Deal, Invoice, Ticket, Document, ...) served over HTTP, MCP and a TypeScript SDK. One workspace is one company. You never write SQL; you read and write records through the API, the MCP tools or the SDK, and the service enforces identity rules, references, policies and revisions.

Follow the steps in order. Stop and ask the user when a step needs a value only they have (an email, a domain, a plan price).

## 1. Create or connect a workspace

To create one, follow the guide at `https://postware.ai/docs-md/start`: it makes a real workspace with no account, and the user claims it afterwards. To connect to an existing one, the user creates an API key on the dashboard.

Either way, keep the values in the environment, never in a file the agent commits:

```sh
export POSTWARE_URL=<the workspace's API URL>
export POSTWARE_WORKSPACE=<the workspace slug>
export POSTWARE_API_KEY=<the API key>
```

Check the connection: `curl -s -H "Authorization: Bearer $POSTWARE_API_KEY" $POSTWARE_URL/w/$POSTWARE_WORKSPACE/v1/me`.

## 2. Read the schema first

Call `schema_describe` without arguments for the list of models, then `schema_describe` with `model` for each one you will write. Note, per model:

- the **identity rules**: which paths dedupe a record (Person by `emails.value` or an identifier, Organization by a `domain` identifier, Invoice by `number`). Use `record_upsert` for anything with an identity rule.
- the **status categories** of `status.category` (Deal: open, won, lost; Invoice: draft, open, paid, void, uncollectible). `state` is the workspace's own label; `category` is the standard.
- the **required fields** and the `agent_context` prose, which says how the model is meant to be used.
- the **policies that apply to the caller**: what end users and the public can read.

Without MCP, `GET /w/{ws}/v1/schema/{model}` returns the same document.

## 3. Add the MCP server to the client

Claude Code: copy `examples/mcp-claude-code.json` into the project's `.mcp.json`. Cursor: copy `examples/mcp-cursor.json` into `.cursor/mcp.json`. Both read the server URL, workspace and token from the environment; never paste the token into the file. The endpoint is `{POSTWARE_URL}/w/{POSTWARE_WORKSPACE}/mcp` (Streamable HTTP, bearer auth; an OAuth flow starts automatically when the client supports it and no token is set).

The tools appear with the prefix `post_`: `post_schema_describe`, `post_record_query`, `post_record_get`, `post_record_create`, `post_record_update`, `post_record_upsert`, `post_record_delete`, `post_record_batch`, `post_record_search`, `post_import_run`, `post_export_run`. Resources `schema://index` and `schema://{model}` carry the model reference as Markdown.

## 4. Scaffold the product on the SDK

Install the SDK with `npm i @postware/sdk`. Then, in the product:

- **End users are Persons.** Sign-up and sign-in are the magic link flow: `a.auth.magicLink.request(email, redirectUri)` on the login page, `a.auth.magicLink.handleCallback()` on the callback page, `a.auth.refresh()` when a request returns `unauthorized`. The server creates the Person and its Identity; you never create Identities. An end user reads and updates its own Person and reads its own Invoices, Subscriptions, Payments and Tickets through the pack policies; nothing else.
- **Plans are Products and Prices.** One Product per plan (`kind: service`), one Price per billing interval (`interval: month | year`, `amount: { amount: "29.00", currency: "USD" }`, `usage_based: false`).
- **Charges are Invoices and Payments.** A charge is an Invoice (`direction: receivable`, `counterparty` the Person or Organization, `lines[]`, `total`, `status.category: open`) and, when paid, a Payment (`direction: incoming`, `applied: [{ invoice, amount }]`) with the Invoice moving to `paid` (that transition emits `invoice.paid`). Subscriptions tie a counterparty to Prices with a `current_period`.
- **Operators are Members.** Your team and your agents are Members with roles; agents use API keys scoped to what they do (`scopes`, optional `where`).

See `examples/scaffold.md` for a walkthrough with code.

## 5. Seed the workspace

- CRM: one Pipeline with its stages (`key`, `label`, `category: open | won | lost`, `order`), marked `default: true`.
- Content: Collections for `docs`, `blog` and `changelog` (`public: true` publishes Documents with `status.category: published` at `/p/{ws}/document`), and the first Documents (`slug` unique within the collection, `body` Markdown, `authors` the Members who wrote it).
- Support: nothing to seed; Tickets arrive with `requester` the end user's Person.
- Tags: create the ones the team will filter by (`customers/vip`, `plan/pro`); tag slugs on records resolve automatically.

Use `record_batch` with `atomic: true` and a `dry_run: true` pass first so the whole seed is validated before anything is written.

## 6. The six rules

1. **Never write SQL.** The API, the MCP tools and the SDK are the only way in; there is no SQL tool and none may be added.
2. **Never store credentials in records.** Tokens, passwords and API keys live in the identity store the server manages; a record field is never the place for a secret.
3. **Always pass `if_match`** (SDK: `ifMatch`) from the record you read when updating. A `conflict` error means someone changed it: read again, then update again.
4. **Upsert by identity, never create duplicates.** Before `record_create` on a model with identity rules, query by the identity path or use `record_upsert`.
5. **Validate with `dry_run` before bulk writes and imports.** Batches and CSV imports accept `dry_run: true`; read the result, fix the mapping, then run for real.
6. **Read `schema_describe` before guessing a field.** Field names, enum values and status categories come from the schema, never from memory; `validation_failed` tells you the path.
