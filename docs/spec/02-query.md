# 02. The query grammar

One JSON object used by `POST /w/{ws}/v1/{model}/query`, by policies (`where`), by shares (`scope.where`), by views later, and by the SDK.

```json
{
  "where": { ... },
  "order": ["-updated_at", "name.family"],
  "limit": 50,
  "cursor": "eyJ...",
  "include": ["organization", "people"],
  "fields": ["id", "name", "emails"],
  "search": "acme",
  "include_deleted": false
}
```

## 1. `where`

A condition object. Keys are field paths or the logical operators `and`, `or`, `not`.

```json
{ "status.category": "open" }                         // shorthand for eq
{ "amount.amount": { "gte": "100", "lt": "500" } }    // several operators on one path
{ "and": [ {...}, {...} ] }
{ "or":  [ {...}, {...} ] }
{ "not": {...} }
{ "tags": { "any": ["customers/vip", "hubspot:lists/newsletter"] } }
{ "assignees": { "any": ["01J..."] } }                // ref lists by id
{ "organization": "01J..." }                          // single ref by id (shorthand for organization.id)
{ "identifiers": { "system": "stripe:customer", "value": "cus_123" } }
{ "ext.hubspot.lifecycle_stage": "lead" }
{ "emails.value": "jane@example.com" }                 // any element of a value-type list
{ "counterparty": { "eq": "@principal.person" } }      // variables, only inside policies and shares
```

Operators: `eq` (default), `ne`, `lt`, `lte`, `gt`, `gte`, `in` (array), `nin`, `contains` (substring, case-insensitive, strings only), `starts_with`, `ends_with`, `is_null` (true/false), `exists` (true/false; for `ext.*` keys), `any`, `all`, `none` (arrays of scalars or ref ids), `between` (`[a, b]`, inclusive).

The Scope operand: on a ref path, the operand of `in`, `nin`, `any`, `all` or `none` may be a `Scope` object `{ "model": "ticket", "ids"?: [...], "where"?: {...} }` instead of a list of ids, meaning "the ids of the live records of that model matching the scope" (`{ "about": { "any": { "model": "ticket", "where": { "requester": "@principal.person" } } } }`, `{ "collection": { "in": { "model": "collection", "where": { "public": true } } } }`). It compiles to `IN (SELECT id FROM r_<model> WHERE deleted_at IS NULL AND <where>)` on the ref's id column, or on `record_refs.target_id` for ref lists (including refs inside object lists such as `lines.product`); variables inside the scope's `where` are substituted like any other. Policies and shares use it to follow a reference (04 section 5).

Paths: `field`, `field.sub` (value types and inline objects), `field.sub` on lists means "any element", `ext.<ns>.<name>`, `tags`, `identifiers`, `owner`, `created_by.id`, `created_at`, `updated_at`. Unknown paths are a `validation_failed` error (code `unknown_path`) unless the path starts with `ext.` and the extension is declared.

Compilation: projected scalar columns are used when they exist; everything else compiles to `json_extract(doc, '$.path')` or, for lists, `EXISTS (SELECT 1 FROM json_each(doc, '$.list') WHERE json_extract(value, '$.sub') ...)`; `tags` compiles against `record_tags` joined to `tags`; ref lists against `record_refs`; `identifiers` against the `identifiers` table. Dates compare as ISO strings; decimals compare with `CAST(... AS REAL)` for `lt/gt` (documented approximation) and as strings for `eq`.

## 2. `order`, `limit`, `cursor`

`order`: list of paths, `-` prefix for descending; the engine appends `id` as the final tiebreaker. Default `["-updated_at"]`. Only projected columns and envelope fields may be ordered on (`validation_failed` otherwise). `limit` default 50, max 500. `cursor` is an opaque base64url of `{"o": [values in order], "id": "..."}` for keyset pagination; a response carries `next_cursor` when more rows exist, else null.

## 3. `include`

Names of single-ref fields or ref-list fields on the queried model (depth 1). Included records are returned in `included`, a map `"model/id" -> record`, after policy filtering: an included record the principal may not read is omitted (and the ref stays in the parent). `include` on polymorphic refs (`to: any`) includes whatever model the ref points to.

## 4. `fields`

Projection of top-level fields in the response; the envelope's `id`, `model`, `revision` and `updated_at` are always present. Policies with a `fields` allow-list intersect with this.

## 5. `search`

Full text over `records_fts` for the model (FTS5, prefix matching, BM25 order unless `order` is given); combined with `where` by AND. `record_search` is `query` with `search` set; the HTTP endpoint `/v1/search` searches across models and returns `{model, id, snippet}`.

## 6. Response envelope

```json
{ "data": [ {record}, ... ], "included": { "organization/01J...": {record} }, "next_cursor": "..." | null }
```

Single records: `{ "data": {record} }`. Writes return the stored record (full envelope, new `revision`).

## 7. Errors

```json
{ "error": { "code": "validation_failed", "message": "lines[0].quantity is required", "details": [ { "path": "lines.0.quantity", "code": "required" } ] } }
```

| HTTP | code |
|---|---|
| 400 | `validation_failed` (details carry `required`, `invalid`, `ref_not_found`, `unknown_tag`, `reserved_namespace`, `extension_undeclared`, ...), `unknown_path`, `bad_cursor`, `bad_request` |
| 401 | `unauthorized` (missing or invalid token) |
| 403 | `forbidden` (policy denies), `scope_missing` |
| 404 | `not_found` (also returned instead of 403 when the principal may not know the record exists) |
| 409 | `conflict` (revision mismatch on `If-Match`; an `Idempotency-Key` reused with a different body), `duplicate` (identity rule), `already_exists` |
| 413 | `too_large` |
| 405 | `unsupported` (the operation is not offered, for example uploading file content through the API instead of a presigned URL) |
| 499 | `cancelled` (the client went away) |
| 501 | `unsupported` (SSE replay the store cannot serve) |
| 429 | `rate_limited`, `quota_exceeded` (with `Retry-After` where sensible) |
| 500 | `internal` (with a request id, never a stack) |
