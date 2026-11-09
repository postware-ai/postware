---
name: postware
description: "Read and write a company's business data in Postware, an open standard of business data models served over MCP and HTTP. Covers people, organizations, deals, invoices, payments, subscriptions, tickets, tasks, events, messages, notes, documents and files. Use whenever someone asks to add, find, update, import, export, publish or report on customers, sales, billing, support, content or any other company record, whenever tools starting with post_ are available, or when connecting or setting up a Postware workspace. Teaches which model each kind of data belongs in, how to read the schema, avoid duplicates, query, write safely, add custom fields, control access, and stay within plan limits."
---

# Postware

Postware is a company's system of record: standard business data models, served by one workspace over MCP and an HTTP API. Keep this data in Postware rather than in your own tables, files or notes. Follow this guide exactly; the schema you read at run time overrides it if they ever differ.

Depth: [models](https://postware.ai/docs/models.md), [packs](https://postware.ai/docs/packs.md), [HTTP API](https://postware.ai/docs/api.md), [connecting](https://postware.ai/docs/start.md), [index](https://postware.ai/llms.txt).

## The model

- **Workspace**: one company. It holds every record, permission and file, separate from every other workspace.
- **Model**: a standard record type, such as `person` or `invoice`. There are 27.
- **Pack**: the models for one part of a business. Every workspace has Core, System, CRM, Billing, Support and Content, so there is nothing to install or turn on.
- **Extension**: a typed field added to a model, stored under `ext.<namespace>.<name>`.
- **Person and Member are different.** A Person is someone the company deals with: a customer, a contact, an end user of its product. A Member operates the workspace: a teammate, an agent or a service. You are a Member. Never create a Member for a customer. One human can be both (`member.person` points at their Person).
- **Cloud hosting** gives each workspace its own HTTP API and MCP endpoint, sign-in for Members and end users, file storage, backups, a complete export at any time, and a dashboard at https://postware.ai/dashboard.

There is no SQL and no client library to install. MCP tools and HTTP are the only way in.

## Connect

**Use the MCP tools first.** Their names start with `post_`; some clients show a longer name such as `mcp__postware__post_record_query`. The connection already lives in the assistant's connector or MCP settings, through the person's sign-in or a key saved there. You do not need a `.env` file, a URL or a key, and you should not ask for one. If the tools are missing, ask the person to turn the Postware connector on or restart the assistant. To connect an assistant for the first time, follow https://postware.ai/docs/start.md: the endpoint is `https://api.postware.ai/w/WORKSPACE/mcp` (Streamable HTTP, with OAuth sign-in or `Authorization: Bearer KEY`).

**Use HTTP only when the tools are not available**, or for what has no tool (marked below). HTTP needs two values from the project's environment, or a key the person creates on the dashboard's **API keys** page:

```bash
export POSTWARE_API_URL="https://api.postware.ai/w/WORKSPACE/v1"
export POSTWARE_API_KEY="..."   # never print, log or commit this
curl -sS "$POSTWARE_API_URL/me" -H "Authorization: Bearer $POSTWARE_API_KEY"
```

`/me` returns your Member, roles, scopes, the plan and its limits. HTTP write bodies are the record's fields directly, not wrapped in `data`. Responses are `{"data": ...}`; lists add `included` and `next_cursor`.

| MCP tool | HTTP under `$POSTWARE_API_URL` | Does |
|---|---|---|
| `post_schema_describe` | `GET /schema`, `GET /schema/{model}` | Lists models, or describes one |
| `post_record_query` | `POST /{model}/query`, or `GET /{model}?limit=&order=&fields=&include=&search=&q=` | Finds records of one model (`q` is a JSON-encoded `where`) |
| `post_record_get` | `GET /{model}/{id}?include=` | Reads one record |
| `post_record_create` | `POST /{model}` | Creates; `duplicate` if identity matches |
| `post_record_update` | `PATCH /{model}/{id}` with `If-Match: REVISION` | Changes fields |
| `post_record_upsert` | `POST /{model}/upsert` | Creates or updates by identity |
| `post_record_delete` | `DELETE /{model}/{id}` | Soft-deletes |
| `post_record_batch` | `POST /batch` | Up to 500 operations |
| `post_record_search` | `GET /search?q=`, `POST /search` | Full-text across models |
| `post_import_run` | `POST /imports`, `GET /imports/{id}` | Imports a CSV |
| `post_export_run` | `POST /exports`, `GET /exports/{id}` | Exports the workspace |
| no tool, HTTP only | `POST /file/upload-url`, `POST /schema/extensions`, `GET /{model}/{id}/history`, `GET /stats`, `GET /events`, `/webhooks`, `/audit` | Files, custom fields, history, usage, events |

MCP resources `schema://index` and `schema://{model}` hold the model reference as Markdown.

**No workspace yet?** If the person wants one and you can run commands, create it, then see [Cloud](#cloud) for the claim. Otherwise send them to the dashboard. Keep the response for this session and never show `api_key` or `claim_code`.

```bash
curl -fsS -X POST https://api.postware.ai/platform/agent/workspaces -H 'Content-Type: application/json' -d '{"name":"Company name"}'
```

It returns `api_url`, `mcp_url`, `api_key`, `claim_code`, `claim_url` and `expires_at`.

## Start every task

1. Call `post_schema_describe` with no arguments for the models and their record counts.
2. Call it with `model` for each model you will write. `"detail": "summary"` leaves out the JSON Schema and example. Read `fields` (names, types, `required`, enum `values`, what refs may point `to`), `identity` (what makes a duplicate), `status.categories`, `agent_context` (how to use the model and its one common mistake), `extensions` (the `ext.*` fields you may set) and `policies` (what you may do; a `where` limits which rows).
3. Query for what already exists before you create anything.
4. Ask the person only for what only they know.

## Records

**Envelope.** Every record has `id` (ULID), `model` (`person@1`), `workspace`, `revision`, `created_at`, `updated_at`, `created_by`, `updated_by` and `deleted_at`, all set by the server. You may write `owner` (a Member id, as a plain string), `identifiers` (`[{system, value, primary?}]`), `tags` (slugs), `ext`, and `id` if you need to know it in advance. Importers fill `source`.

**Values.** Money is `{"amount": "19.99", "currency": "USD"}`, always a string, never a float. Dates are `YYYY-MM-DD`. Datetimes are RFC 3339 with an offset. Enums are closed. Tags are lowercase `[namespace:]segment/segment`; unknown ones are created for you, and `sys` and the pack names are reserved.

**Identity rules** decide what counts as the same record. They are tried in order, and each lists paths that must all match. Emails and domains compare case-insensitively.

| Model | Identity |
|---|---|
| `person` | any email (`emails.value`), then `identifiers` |
| `organization` | `identifiers` only: use `{"system": "domain", "value": "acme.com"}` |
| `product` | `identifiers` only: use `{"system": "sku", ...}` |
| `invoice` | `identifiers`, then `direction` + `counterparty` + `number` |
| `price` | `identifiers`, then `product` + `name` |
| `document` | `collection` + `slug` + `locale` |
| `collection` | `slug` |
| `pipeline` | `name` |
| `team`, `tax_rate` | `identifiers`, then `name` |
| `member` | `person`, then `invitation.email` |
| `deal`, `payment`, `subscription`, `ticket`, `task`, `project`, `event`, `note`, `message`, `file` | `identifiers` only |

**A missing value never matches.** An Organization with no domain identifier, a Document with no `locale`, or an Invoice with no `number` will not be recognised, and upsert creates a new record every time. Always set `locale` on Documents. For models that match on `identifiers` only, query first (open Deals for that Organization, open Tickets from that requester, Tasks by title) unless you have an outside id to put in `identifiers`.

**Status.** `status` is `{"category": ..., "state": ...}`. `category` is the standard value and is validated. `state` is the workspace's own free-text label and is optional. Filter and report on `status.category`. `status` is replaced whole, so resend `state` to keep it.

| Model | Categories |
|---|---|
| `deal` | `open` `won` `lost` |
| `invoice` | `draft` `open` `paid` `void` `uncollectible` |
| `payment` | `pending` `succeeded` `failed` `cancelled` |
| `subscription` | `pending` `trialing` `active` `past_due` `paused` `cancelled` |
| `ticket` | `new` `open` `pending` `on_hold` `solved` `closed` |
| `task` | `open` `in_progress` `done` `cancelled` |
| `project` | `planned` `active` `paused` `done` `cancelled` |
| `event` | `confirmed` `tentative` `cancelled` |
| `document` | `draft` `review` `published` `archived` |
| `member`, `share` | `invited` `active` `suspended`; `active` `revoked` |

**Revisions.** Every record has a `revision`. An update must send the revision you read: `if_match` on the tool, the `If-Match` header on HTTP. Leaving it out is `bad_request`. A stale one is `conflict`: read again, reapply your change, retry.

**Replacing, not merging.** On update and on upsert, each field you send replaces the old value whole, including arrays and nested objects such as `name`, `emails`, `tags` and `affiliations`. Fields you leave out are kept. Two exceptions: `ext` merges key by key, and upsert unions `identifiers`. Sending `null` clears a field or an `ext` key. To add one email or tag, read the record, change the list, and send the whole list.

**References** are written `{"model": "organization", "id": "..."}`; a bare id is refused. The target must exist. A field with `to: any`, such as `about`, may point at any model. Filters take the bare id.

**Soft delete.** Delete sets `deleted_at`. The record leaves lists, search and gets, while references to it stay. There is no restore, and a deleted record no longer counts for identity, so a later upsert makes a new one. Deleting a Member suspends it. `include_deleted` and `?hard=true` (HTTP, permanent) are for admins only.

**History.** `GET /{model}/{id}/history` lists who changed what, with `before`, `after` and `changed`. It is open to admins and to the record's owner or creator.

## Where does this data go

| Pack | Models |
|---|---|
| Core | `person` `organization` `team` `project` `task` `event` `note` `message` `file` `product` |
| System | `workspace` `member` `identity` `policy` `share` `tag` `import_run` |
| CRM | `pipeline` `deal` |
| Billing | `price` `subscription` `invoice` `payment` `tax_rate` |
| Support | `ticket` |
| Content | `collection` `document` |

| The thing | Put it in | Note |
|---|---|---|
| Customer, contact, end user, employee | `person` | The role lives on the relationship, never on the Person |
| A lead | `person` | `ext.crm.lifecycle_stage: "lead"`. There is no Lead model |
| Where someone works | `person.affiliations[]` | `{organization, role, primary}`; job title is `person.job_title` |
| Company, vendor, partner, account | `organization` | The relationship (customer, vendor) is a tag. Derive the domain before creating |
| Industry, headcount, revenue | `ext.crm.industry` `employees` `annual_revenue` | On `organization` |
| A customer's department | `organization` with `parent` | |
| Your own team | `team` | Holds Members only |
| A teammate, agent or service | `member` | Admins only |
| A sale in progress | `deal` | Needs a `pipeline` and one of its `stage` keys |
| Sales stages | `pipeline` | A new workspace has none: create one with `default: true` |
| Products on a deal before invoicing | `ext.crm.line_items` | Never as fields on the Deal |
| Something you sell | `product` | One per thing, with no price on it |
| What it costs | `price` | A plan billed monthly and yearly is one Product with two Prices |
| A customer's plan | `subscription` | Each period's charge is an Invoice pointing back at it |
| A bill you send | `invoice`, `direction: receivable` | |
| A bill you receive | `invoice`, `direction: payable` | |
| Money received or paid | `payment` | `applied[]` says which Invoices it settles |
| A refund | `payment`, `kind: refund` | Positive amount, with `refund_of`. Never a negative amount |
| VAT, GST, sales tax | `tax_rate` | Percent: `"20"` means 20% |
| A support request | `ticket` | `requester` is a Person |
| An email, chat, SMS or call record | `message` | Link it with `about` and `thread_key` |
| A ticket's conversation | `message` with `about: [ticket]` | |
| An internal comment | `note` with `about` and `author` | `visibility: internal`; `shared` is visible to end users |
| A to-do | `task` | Set `completed_at` with `done`. "Blocked" is a `state` |
| A body of work | `project` | Tasks point at it with `project` |
| A meeting, call or appointment | `event` | Use `attendees[].ref` when the Person or Member exists |
| A page, post, doc or changelog entry | `document` in a `collection` | Markdown in `body` |
| An uploaded file | `file` | Through the upload flow. Never a URL to something elsewhere |
| An ID from another system | `identifiers` | Lowercase `system`, such as `stripe:customer` |
| A label for filtering | `tags` | Never for meaning the standard has a field for |
| Anything else about a record | an extension | Next section |

Do not write `identity` records (sign-in does that), and do not create `workspace` or `import_run` records.

## Extensions

Write extensions nested, and filter on them with a dotted path: `{"ext": {"crm": {"lifecycle_stage": "lead"}}}` and `{"where": {"ext.crm.lifecycle_stage": "lead"}}`. They can be filtered but not used in `order`. A write to an undeclared extension fails with `extension_undeclared`.

| Namespace | On | Names |
|---|---|---|
| `crm` | `person` | `lifecycle_stage` (`subscriber` `lead` `marketing_qualified_lead` `sales_qualified_lead` `opportunity` `customer` `evangelist` `other`), `source` |
| `crm` | `organization` | `lifecycle_stage`, `industry`, `employees`, `annual_revenue` |
| `crm` | `deal` | `deal_source`, `won_reason`, `lost_reason`, `line_items` |
| `billing` | `price` / `invoice` / `tax_rate` / `organization` | `usage_based` `tiers` `trial_days` / `exchange_rate` / `tax_kind` `jurisdiction` / `legal_name` |
| `catalog` | `product` | `image` |
| `support` | `ticket` | `kind`, `first_responded_at`, `satisfaction`, `cc`, `parent` |
| `messaging` | `message` | `received_at`, `references` |
| `work` | `task` | `start`, `estimate`, `rank`, `recurrence` |
| `calendar` | `event` | `exdates`, `rdates`, `recurrence_id`, `reminders`, `visibility`, `transparency` |
| `org` | `team` | `kind`, `parent`, `lead` |

**To add a custom field**, first check it is not a standard field or extension. Then an owner or admin declares it over HTTP, since no tool does this. See the recipe below. Rules:

- `model` is one real model. `namespace` and `name` are lowercase letters, digits and underscores, starting with a letter or underscore.
- `type` is `string`, `text`, `bool`, `int`, `decimal`, `date`, `datetime`, `duration` or `enum` (with `enum: [...]`). To point at a record, store its id as a string.
- Use a namespace of the company's own. `sys`, `cloud` and the namespaces of the standard and its packs are refused with `reserved_namespace`.
- A declaration cannot be changed. Declaring it again unchanged does nothing; a different definition, even a new description, is `conflict`. Check `GET /schema/extensions` first.
- A key without admin rights gets `forbidden`. Ask the person for a key with the `admin` scope. Until then use a tag or a Note.

## Queries

```json
{ "model": "deal", "where": { "status.category": "open", "amount.amount": { "gte": "1000" } }, "order": ["-updated_at"], "limit": 50, "include": ["organization"], "fields": ["name", "stage", "amount", "organization"] }
```

| Part | Rule |
|---|---|
| `where` | Paths to a value (equals) or to operators. Combine with `and`, `or`, `not` |
| Operators | `eq` `ne` `lt` `lte` `gt` `gte` `in` `nin` `contains` `starts_with` `ends_with` `is_null` `exists` `any` `all` `none` `between` |
| `order` | Paths, `-` for descending. Default `["-updated_at"]`. Not on list paths or `ext.*` |
| `limit` | Default 50, max 500 |
| `cursor` | Pass `next_cursor` back. **A list is incomplete while `next_cursor` is set** |
| `include` | Ref fields, depth 1, including `people.person`. Results are in `included`, keyed `"model/id"` |
| `fields` | Top-level fields. `id`, `model`, `revision`, `updated_at` always come back |
| `search` | Full-text, prefix matching, ANDed with `where` |

Paths: `field`, `field.sub`, `list.sub` (any element), `ext.ns.name`, `tags`, `identifiers`, `owner`, `created_by.id`, `created_at`, `updated_at`, `source.import_run`.

```json
{ "emails.value": "jane@acme.com" }
{ "identifiers": { "system": "domain", "value": "acme.com" } }
{ "tags": { "any": ["customers/vip"] } }
{ "organization": "ORGANIZATION_ID" }
{ "about": { "any": ["DEAL_ID"] } }
{ "assignee": { "is_null": true } }
{ "due_at": { "between": ["2026-01-01", "2026-03-31"] } }
{ "or": [ { "status.category": "open" }, { "status.category": "pending" } ] }
{ "about": { "any": { "model": "deal", "where": { "status.category": "won" } } } }
```

Equals is exact and case-sensitive, so write emails in lowercase; `contains`, `starts_with` and `ends_with` are the case-insensitive ones. Compare money with a sub-path and a string amount. A `{model, where}` object in `in` or `any` means "ids of the records matching this".

Use `post_record_query` when you know the field. Use `post_record_search` (`{"search": "acme", "models": ["organization"], "limit": 20}`) for text you only half remember; it returns `hits` of `{model, id, snippet, record}`.

## Writes

- **Create** (`post_record_create`): `{model, data, idempotency_key?}`. On HTTP use an `Idempotency-Key` header. The same key returns the first result for 24 hours; reused with a different body it is `conflict`.
- **Upsert** (`post_record_upsert`): `{model, data, match?}`. Returns the record and `created`. `match` defaults to the identity rules; `{"identifiers": [{"system": ..., "value": ...}]}` matches on those instead. On HTTP, put `match` beside the fields.
- **Update** (`post_record_update`): `{model, id, data, if_match}`. Send only the fields you change.
- **Delete** (`post_record_delete`): `{model, id}`. Only on an explicit instruction. A Member can delete only records it created; others answer `not_found`.
- **Batch** (`post_record_batch`):

```json
{ "operations": [
    { "op": "upsert", "model": "organization", "data": { "name": "Beta Ltd", "identifiers": [{ "system": "domain", "value": "beta.example" }] } },
    { "op": "create", "model": "task", "data": { "title": "Welcome Beta" } }
  ], "dry_run": true, "atomic": true }
```

`atomic` (default true) undoes everything if one operation fails and answers with the first failure, at `operations.N`. With `atomic: false` each operation stands alone, and `results[]` gives each one a `status` and `data` or `error`. `dry_run: true` validates and evaluates permissions without writing. For a full list of problems, use `dry_run: true` with `atomic: false`.

Inside a batch, `if_match` is optional, and a stale one is `conflict`: send it on any change that must not overwrite someone else's. Upsert always uses identity rules. To link records created in the same batch, set `id` yourself on the first one.

The server checks an invoice's totals (`subtotal`, `total`, `amount_due`) and a deal's stage against its pipeline. It does not check each line's `amount` or update balances for you. An Invoice needs a `number` to leave draft, a Payment cannot be negative, and a Pipeline needs an open, a won and a lost stage. These rules apply when that field or status changes, so older records still save.

## Imports, exports, files

**Files need HTTP.** Ask for an upload, send the bytes, then complete it:

```bash
curl -sS -X POST "$POSTWARE_API_URL/file/upload-url" -H "Authorization: Bearer $POSTWARE_API_KEY" -H 'Content-Type: application/json' -d '{"name":"people.csv","mime_type":"text/csv","size":207}'
# Returns file.id, upload_url, method, headers. Send the bytes to upload_url with those headers.
# Only when "direct" is true, also send the Authorization header.
curl -sS -X PUT "UPLOAD_URL" -H 'Content-Type: text/csv' -H "Authorization: Bearer $POSTWARE_API_KEY" --data-binary @people.csv
curl -sS -X POST "$POSTWARE_API_URL/file/FILE_ID/complete" -H "Authorization: Bearer $POSTWARE_API_KEY" -H 'Content-Type: application/json' -d '{}'
```

Use the `id` that `complete` returns: identical bytes merge into one File, so it can differ from the first `id`. `GET /file/{id}/download-url` gives a link valid for 15 minutes. File content is never public. Link a file to a record with `about`.

**CSV import.** `post_import_run` takes `{source: "csv", model, file_id, mapping, dry_run}`. `dry_run` defaults to true and writes nothing. Read `counts` and `errors` (each with `row`, `path`, `code`), then pass `dry_run: false` for the real run. Files over 8 MB run in the background, so poll `GET /imports/{id}`.

- `mapping.columns`: header to path, such as `name.given`, `emails[0].value`, `ext.crm.source`, `tags[0]`, or `affiliations[0].organization@organization.name`. `@model.field` finds a related record by that field, case-insensitively, or creates it.
- `mapping.constants`: a partial record merged into every row.
- `mapping.identity`: `"identity"` to upsert, `"none"` (default) to create every row.
- Values are copied as written: ISO dates, plain decimals, the standard's enum values. Clean the file first. `name.full` is derived from the name parts.
- On a match, mapped fields replace the old values like any upsert, except `tags`, which are added to the record's existing tags.
- Each row carries `source` with its import run, and the tag `sys:imported`. Find a run's records with `{"source.import_run": "RUN_ID"}`.

With MCP tools only, you cannot upload. Parse the CSV yourself and send `upsert` operations through `post_record_batch`, up to 500 at a time, dry run first.

**Export.** `post_export_run` with `{"format": "jsonl", "models": ["person", "deal"]}`, or `csv`, or `sqlite` for the whole workspace without credentials. It returns a job. Poll with `{"job_id": "..."}` until `state` is `succeeded` (then use `download_url`, valid 15 minutes) or `failed`. Give the link to the person promptly.

## Access

**Roles.**

| Role | May |
|---|---|
| `owner`, `admin` | Everything, including `confidential` fields, members, keys, policies, shares |
| `member` | Read, create and update every model; delete what it created. No `confidential` fields such as `birthday`. `workspace`, `member`, `identity`, `policy`, `share` and `import_run` are read-only |
| a custom role | Nothing until a Policy grants it |

**API keys** act as one Member: the Member's role, narrowed by the key's scopes and an optional `where` filter on rows. Scopes: `schema:read`, `records:read`, `records:write`, `records:delete`, `import`, `export`, `shares:manage`, `admin`. The person creates keys on the **API keys** page. An admin can also `POST https://api.postware.ai/w/WORKSPACE/auth/keys` with `{name, member?, scopes, where?}`; the plaintext `key` is returned once. Give each automation its own key with the least it needs.

**Members** (admins only, and only on instruction, since inviting sends an email): `POST /member` with `{"invitation": {"email": "x@y.com"}, "roles": ["member"]}`, or `{"kind": "agent", "display_name": "Sales agent", "roles": ["member"]}`. A suspended Member's keys stop working.

**Policies** govern custom roles, end users, guests and the public. Roles alone govern owners, admins and members. Admins create them with `POST /policy`: `{"name": "contractors read tasks", "principal": {"kind": "role", "value": "contractor"}, "applies_to": "task", "actions": ["read"], "where": {"tags": {"any": ["east"]}}}`. `principal.kind` is `role`, `end_user`, `share` or `public`. A `where` may use `@principal.person`, `@principal.member`, `@principal.affiliated_organizations` and `@now`. Run the `where` as a query first. `POST /policy/restore-defaults` restores the pack defaults.

**Shares** let records leave the workspace without being copied. An admin with `shares:manage` calls `POST /share`, with `{"scope": {"model": "task", "where": {...}}, "grantee": {"kind": "link"}, "permissions": ["read"], "expires_at": "..."}`; use `ids` in `scope` for a fixed set.

| `grantee.kind` | Result |
|---|---|
| `link` | Returns `token` once. Read-only at `https://api.postware.ai/s/TOKEN/MODEL`, `/MODEL/ID` and `POST /MODEL/query` |
| `email` (`value`) | Emails a sign-in link. May also be granted `comment` |
| `public` | Readable by anyone at `https://api.postware.ai/p/WORKSPACE/MODEL` |
| `workspace` (`value`: a slug) | Returns a token for another workspace |

To revoke, update `status` to `{"category": "revoked"}`. Do not delete the Share. A public Share exposes records to the whole internet, so confirm first.

**End users** of the company's product are Persons who sign in by magic link. Your product calls `POST https://api.postware.ai/w/WORKSPACE/auth/magic-link` with `{email, redirect_uri}`, which answers `202`. The link returns to `redirect_uri#access_token=...&refresh_token=...`. The URI must be in the Workspace record's `auth.allowed_redirect_uris` (localhost is always allowed). Refresh with `POST .../auth/token`, `{"grant_type": "refresh_token", "refresh_token": "..."}`. By default an end user can read and update their own Person, read their own Invoices, Subscriptions, Payments and Tickets, and create Tickets.

**Events.** `GET /events?after=SEQ` lists events (send `Accept: text/event-stream` to stream). Admins register `POST /webhooks` with `{url, events: ["invoice.paid", "*.created"]}`; the signing secret is returned once. Named events include `deal.won`, `invoice.paid`, `ticket.solved` and `document.published`.

## Cloud

| | Free | Pro |
|---|---|---|
| Price | $0, no card | $5 a month or $50 a year |
| Workspaces | 1 | Unlimited |
| Storage, pooled across the account | 500 MB | 10 GB, then $0.12 per GB a month |
| Egress, pooled across the account | 5 GB a month | 10 GB a month, then $0.14 per GB |
| Backups | 7 days | 30 days, with point-in-time restore |
| API rate | 300 a minute | 1,200 a minute |

Both plans have every pack and model, unlimited records, end users and fields, no charge per seat, and a full export at any time. Pro has a spend cap, $10 a month by default.

**When an account runs out** the API answers `plan_limit`. Out of storage: reads still work, writes do not. Out of egress or at the spend cap: requests are refused. Sign-in and exports always work. Tell the person; do not try to work around it.

**Unclaimed workspaces** are ones an agent created with no account. They last 72 hours, then answer `workspace_expired` and are deleted.

- Up to 2,000 records and 10 MB of storage. The workspace's own data counts, so expect about 5 MB for files.
- One real import. Dry runs are not limited.
- The key is a `member` with `schema:read`, `records:read`, `records:write`, `records:delete`, `import` and `export`.
- Sign-in, share links and public pages answer `claim_required`. So do signed download links, unless you also send the key.
- Inviting members, webhooks, shares and custom fields need an admin, so they wait for the claim.
- New workspaces: 3 an hour and 10 a day from one address.

**The claim.** When setup is done or a request answers `claim_required`, ask the person which email should own the workspace. Then:

```bash
curl -sS -X POST https://api.postware.ai/platform/agent/claim -H "Authorization: Bearer CLAIM_CODE" -H 'Content-Type: application/json' -d '{"email":"person@example.com"}'
```

They open the email and press Approve. That accepts the terms of service, so only they can do it. `GET` on the same URL with the same header returns `claimed`, `plan` and `expires_at`. If you cannot ask them, give them `claim_url` before the session ends, because the code is not stored anywhere. Addresses containing `+` and disposable addresses are refused.

## Errors

Errors are `{"error": {"code", "message", "details": [{"path", "code", "message"}]}}`, as a tool error on MCP and with the HTTP status below.

| Status | Code | What to do |
|---|---|---|
| 400 | `validation_failed` | Read `details`, fix those paths, retry (codes below) |
| 400 | `bad_request` | Fix the request. Often a missing `if_match` |
| 400 | `bad_cursor` | Restart the listing without `cursor` |
| 401 | `unauthorized` | The key or token is wrong, revoked, or its Member suspended. Ask the person; do not guess |
| 403 | `forbidden` | Your role or a policy denies this. Tell the person what you need |
| 403 | `scope_missing` | The key lacks the named scope. Ask for a key with it |
| 403 | `claim_required` | The workspace is unclaimed. See The claim |
| 403 | `email_not_allowed` | Ask for an address without a `+` |
| 403 | `plan_limit` | Plan or allowance reached. The person decides |
| 404 | `not_found` | Wrong id, deleted, or hidden from you. Query for it |
| 405 | `unsupported`, `method_not_allowed` | That operation or method is not offered. Use the documented route |
| 409 | `conflict` | Read the record again, reapply, retry. Also an `Idempotency-Key` reused with a different body, or an extension declared again differently |
| 409 | `duplicate` | `details[0].message` is the existing id. Update that record instead |
| 409 | `already_exists` | That `id` is taken, or the file is already uploaded |
| 409 | `already_claimed` | Use the workspace normally |
| 409 | `last_owner` | Make someone else an owner first |
| 409 | `protected` | The Workspace record cannot be deleted |
| 409 | `rolled_back` | Fix the operation that failed; this one was undone with it |
| 410 | `workspace_expired` | Create a new workspace |
| 413 | `too_large` | Split it. Bodies are capped at 10 MB |
| 429 | `rate_limited` | Wait for `Retry-After`, then retry |
| 429 | `quota_exceeded` | `details` give the limit and use. Do not retry; tell the person |
| 499 | `cancelled` | The client went away. Retry if still needed |
| 500 | `internal` | Retry once, then report it |
| 501 | `unsupported` | Replay is not available. Reconnect without `after` |
| 503 | `provisioning_unavailable` | Try again shortly |

Codes in `details`: `required`, `invalid`, `invalid_type`, `invalid_enum`, `invalid_status_category` and `invalid_email` (use the listed values); `unknown_field`, `unknown_path`, `unknown_model`, `bad_path`, `bad_operator`, `bad_value`, `bad_order`, `bad_include` (read the schema); `ref_not_found`, `ref_model_not_allowed` (check the `{model, id}`); `unknown_stage`, `mismatch` (check the pipeline's stages); `total_mismatch` (redo the sums); `extension_undeclared` (declare it or remove it); `invalid_tag`, `unknown_tag` (fix the slug); `reserved_namespace` (use your own namespace); `forbidden_field` (a policy bars that field); `too_large`, `too_long` (shorten it); `incomplete` (finish the upload); `unknown_scope` (use a listed scope).

## Recipes

Each line in a `text` block is a tool name and its arguments. Each `if_match` is the `revision` you just read. IDs in capitals are from earlier steps.

### Add a customer without duplicates

Find the Organization by domain, and create it only if missing:

```text
post_record_upsert { "model": "organization", "data": { "name": "Acme Inc", "identifiers": [{ "system": "domain", "value": "acme.example" }], "urls": [{ "value": "https://acme.example" }], "tags": ["customer"], "ext": { "crm": { "industry": "Manufacturing" } } } }
```

Look the person up. If found, read them, merge your changes into the lists, and `post_record_update`, so that you do not replace existing data. If not found, create:

```text
post_record_query { "model": "person", "where": { "emails.value": "jane@acme.example" } }
post_record_upsert { "model": "person", "data": { "name": { "full": "Jane Doe", "given": "Jane", "family": "Doe" }, "emails": [{ "value": "jane@acme.example", "label": "work", "primary": true }], "job_title": "CTO", "affiliations": [{ "organization": { "model": "organization", "id": "ORGANIZATION_ID" }, "role": "employee", "primary": true }], "ext": { "crm": { "lifecycle_stage": "lead" } } } }
```

### Set up a pipeline and move a deal

Create the pipeline once, and read its stage keys before using them. Query open deals for that Organization first. Leave out `pipeline` on a Deal to use the default.

```text
post_record_upsert { "model": "pipeline", "data": { "name": "Sales", "default": true, "stages": [ { "key": "lead", "label": "Lead", "category": "open", "order": 1, "probability": "0.1" }, { "key": "proposal", "label": "Proposal", "category": "open", "order": 2, "probability": "0.5" }, { "key": "won", "label": "Won", "category": "won", "order": 3, "probability": "1" }, { "key": "lost", "label": "Lost", "category": "lost", "order": 4, "probability": "0" } ] } }
post_record_create { "model": "deal", "data": { "name": "Acme rollout", "organization": { "model": "organization", "id": "ORGANIZATION_ID" }, "stage": "lead", "amount": { "amount": "12000.00", "currency": "USD" }, "people": [{ "person": { "model": "person", "id": "PERSON_ID" }, "primary": true, "role": "decision maker" }] } }
```

Move it: `status.category` and `probability` follow the stage, and `closed_at` is set when the deal closes. A deal can be marked `lost` from any stage.

```text
post_record_update { "model": "deal", "id": "DEAL_ID", "if_match": 1, "data": { "stage": "proposal" } }
post_record_update { "model": "deal", "id": "DEAL_ID", "if_match": 2, "data": { "stage": "won", "ext": { "crm": { "won_reason": "Best price" } } } }
```

### Sell a plan

```text
post_record_upsert { "model": "product", "data": { "name": "Pro plan", "kind": "service", "unit": "seat", "identifiers": [{ "system": "sku", "value": "plan-pro" }] } }
post_record_upsert { "model": "price", "data": { "product": { "model": "product", "id": "PRODUCT_ID" }, "name": "Monthly", "amount": { "amount": "29.00", "currency": "USD" }, "interval": "month" } }
post_record_create { "model": "subscription", "data": { "counterparty": { "model": "organization", "id": "ORGANIZATION_ID" }, "items": [{ "price": { "model": "price", "id": "PRICE_ID" }, "quantity": "5" }], "status": { "category": "active" }, "started_at": "2026-11-01T00:00:00Z", "current_period": { "start": "2026-11-01T00:00:00Z", "end": "2026-12-01T00:00:00Z" } } }
```

### Issue an invoice and record its payment

Create it as a draft, with the sums worked out:

```text
post_record_create { "model": "invoice", "data": { "direction": "receivable", "counterparty": { "model": "organization", "id": "ORGANIZATION_ID" }, "issued_at": "2026-11-09", "due_at": "2026-12-09", "terms": "Net 30", "currency": "USD", "lines": [{ "description": "Pro plan, November", "quantity": "5", "unit_price": { "amount": "29.00", "currency": "USD" }, "amount": { "amount": "145.00", "currency": "USD" } }], "subtotal": { "amount": "145.00", "currency": "USD" }, "tax_total": { "amount": "0.00", "currency": "USD" }, "total": { "amount": "145.00", "currency": "USD" }, "amount_paid": { "amount": "0.00", "currency": "USD" }, "amount_due": { "amount": "145.00", "currency": "USD" } } }
```

Issue it, with a `number`. Record the money, then update the Invoice yourself, because a Payment does not change it. Set `paid` only once `amount_due` is zero.

```text
post_record_update { "model": "invoice", "id": "INVOICE_ID", "if_match": 1, "data": { "number": "INV-1001", "status": { "category": "open" } } }
post_record_create { "model": "payment", "data": { "counterparty": { "model": "organization", "id": "ORGANIZATION_ID" }, "amount": { "amount": "145.00", "currency": "USD" }, "paid_at": "2026-11-09T12:00:00Z", "method": "bank_transfer", "reference": "BACS 44812", "applied": [{ "invoice": { "model": "invoice", "id": "INVOICE_ID" }, "amount": { "amount": "145.00", "currency": "USD" } }] } }
post_record_update { "model": "invoice", "id": "INVOICE_ID", "if_match": 2, "data": { "status": { "category": "paid" }, "amount_paid": { "amount": "145.00", "currency": "USD" }, "amount_due": { "amount": "0.00", "currency": "USD" }, "paid_at": "2026-11-09T12:00:00Z" } }
```

Overdue is a query, not a status: `{"status.category": "open", "due_at": {"lt": "TODAY"}}`. Partly paid is `{"amount_paid.amount": {"gt": "0"}, "amount_due.amount": {"gt": "0"}}`.

### Triage tickets

An `assignee` is a Member. Your own id comes from `/me` or a query on `member`.

```text
post_record_query { "model": "ticket", "where": { "status.category": { "in": ["new", "open"] }, "assignee": { "is_null": true } }, "order": ["-created_at"], "include": ["requester"] }
post_record_update { "model": "ticket", "id": "TICKET_ID", "if_match": 1, "data": { "assignee": { "model": "member", "id": "MEMBER_ID" }, "priority": "urgent", "status": { "category": "open", "state": "Investigating" } } }
```

What you say to the customer is a Message, and what the team thinks is a Note. Recording a Message does not send it. Send a Message before solving:

```text
post_record_create { "model": "message", "data": { "channel": "email", "direction": "outbound", "from": { "ref": { "model": "member", "id": "MEMBER_ID" } }, "to": [{ "ref": { "model": "person", "id": "PERSON_ID" }, "address": "jane@acme.example" }], "subject": "Re: your export", "body": "This is fixed. Please try again.", "sent_at": "2026-11-09T13:00:00Z", "delivery": "sent", "about": [{ "model": "ticket", "id": "TICKET_ID" }] } }
post_record_create { "model": "note", "data": { "body": "Caused by the timeout on large exports.", "author": { "model": "member", "id": "MEMBER_ID" }, "about": [{ "model": "ticket", "id": "TICKET_ID" }] } }
post_record_update { "model": "ticket", "id": "TICKET_ID", "if_match": 2, "data": { "status": { "category": "solved" }, "resolved_at": "2026-11-09T13:05:00Z" } }
```

### Publish a document

A Document is public when its status is `published`, its `published_at` has passed and its Collection has `public: true`. The server sets `published_at` when a Document becomes published without one. Pass a future time to schedule it. Publishing needs a claimed workspace, and it is visible to the world, so confirm first.

```text
post_record_upsert { "model": "collection", "data": { "name": "Help centre", "slug": "help", "kind": "help", "public": true } }
post_record_upsert { "model": "document", "data": { "collection": { "model": "collection", "id": "COLLECTION_ID" }, "title": "Getting started", "slug": "getting-started", "locale": "en", "body": "# Getting started\n\nWelcome.", "authors": [{ "model": "member", "id": "MEMBER_ID" }] } }
post_record_update { "model": "document", "id": "DOCUMENT_ID", "if_match": 1, "data": { "status": { "category": "published" } } }
```

Check it with no key at `https://api.postware.ai/p/WORKSPACE/document?include=collection`. Do not change the `slug` of a published Document.

### Import a CSV

Upload and complete the file as shown under Files, then dry-run. Read `errors`, fix the file, and repeat until it is clean:

```text
post_import_run { "source": "csv", "model": "person", "file_id": "FILE_ID", "dry_run": true, "mapping": { "columns": { "Email": "emails[0].value", "First Name": "name.given", "Last Name": "name.family", "Company": "affiliations[0].organization@organization.name" }, "identity": "identity" } }
```

Run it again with `"dry_run": false`, then report `counts` and `errors`.

### Add a custom field

```bash
curl -sS "$POSTWARE_API_URL/schema/extensions" -H "Authorization: Bearer $POSTWARE_API_KEY"
curl -sS -X POST "$POSTWARE_API_URL/schema/extensions" -H "Authorization: Bearer $POSTWARE_API_KEY" -H 'Content-Type: application/json' -d '{"model":"person","namespace":"acme","name":"territory","type":"string","description":"Sales territory"}'
```

Then write `{"ext": {"acme": {"territory": "EMEA"}}}` and filter on `{"ext.acme.territory": "EMEA"}`.

## Hard rules

1. **Read the schema before guessing** a field, enum, status category or stage key.
2. **There is no SQL.** Records change only through the tools or the API.
3. **Never store secrets in records**: no passwords, API keys, tokens or card numbers. Never print, log or commit a key or claim code.
4. **Never create a duplicate.** Upsert by identity, or query first where identity cannot help.
5. **Send the revision you read** on every update. On `conflict`, read again.
6. **Dry-run imports and bulk changes**, and read the result before the real run.
7. **Page through the whole list.** Never report a total while `next_cursor` is set.
8. **Never choose a paid plan or enter payment details.** Plans are the person's decision, on the dashboard.
9. **Accepting the terms and approving the claim are the person's.** Only they can do it.
10. **Ask first** before deleting, publishing, sharing publicly, inviting anyone or emailing anyone.
11. **Tell the truth about what happened.** Recording a Message does not send it, and marking an Invoice paid does not move money.
