# 04. Policies and shares

## 1. Roles

| Role | Effect |
|---|---|
| `owner`, `admin` | every action on every model; sees `confidential` fields; manages members, keys, policies, shares, settings |
| `member` | read, create, update on every model; delete only records it created; sees `internal` and `public` fields, not `confidential` |
| custom role | no implicit access; policies with `principal: {kind: role, value: <name>}` grant it |
| API key / agent token | the Member's role, intersected with the key's scopes and its `where` filter |

Roles are evaluated before policies; a request allowed by role does not consult policies (except the key's own `where`).

## 2. Policy records

Stored as `r_policy` rows (model `policy`), shipped by packs as defaults, editable by admins.

```json
{ "name": "end user reads own invoices",
  "principal": { "kind": "end_user" },               // role | end_user | share | public  (named `principal`, the Cedar and OpenFGA word; `subject` is the Identity field)
  "applies_to": "invoice",                           // or "*" (named applies_to because `model` is the envelope field)
  "actions": ["read"],
  "where": { "or": [ { "counterparty": "@principal.person" },
                     { "counterparty.model": "organization", "counterparty": { "in": "@principal.affiliated_organizations" } } ] },
  "fields": null,                                    // optional allow-list
  "enabled": true, "origin": "pack" }
```

Variables available in `where`: `@principal.person` (the end user's Person id, or the Member's `person`), `@principal.member`, `@principal.identity`, `@principal.affiliated_organizations` (ids from the Person's `affiliations[]`), `@share.id`, `@now`.

## 3. Evaluation

For a request `(principal, action, model)`:

1. If the principal's role grants it: allowed; row filter = the API key's `where` if any.
2. Else collect enabled policies where `principal` matches the caller (`end_user` for Persons; `role:<name>` for Members with that custom role; `share` for share principals, restricted to the policies whose `principal.value` is that share (they carry `origin: share`); `public` for anonymous) and `applies_to` matches (exact or `*`) and `actions` contains the action.
3. None: `403 forbidden` for writes; for reads the request proceeds with an always-false filter (so lists are empty and gets are `404`). An update or delete whose target the principal's row filter hides is `404` as well, like the read, so a write cannot probe for a record.
4. Row filter = `OR` of the matched policies' `where` (a policy without `where` matches all rows), ANDed with the request's own `where`.
5. Reads: apply the filter in SQL. Field visibility: union of matched policies' `fields` (null means all fields of the allowed sensitivity); `confidential` fields are never returned to `end_user`, `share` or `public` principals, and `internal` fields only when a matched policy lists them explicitly or has no `fields` restriction.
6. Creates: the record is inserted inside a transaction, then `SELECT 1 FROM r_x WHERE id = ? AND (<row filter>)` must return a row, else rollback with `403`. The same check runs after updates (post-image) and before deletes (pre-image). `fields` on a create or update policy restricts which fields the request may set.
7. Decisions for `end_user`, `share` and `public` principals are recorded in `audit_log` with the matched policy ids; role grants are not.

Admin-only models: `workspace`, `member`, `identity`, `policy`, `share`, `import_run` are readable by members and writable only by admins, regardless of policies, except that a principal may read its own Member and Identity records.

## 4. Pack defaults (compiled into `standard/dist/policies/<pack>.json`)

- core: end user reads and updates its own Person (`id = @principal.person`), fields except `affiliations`; reads Notes authored by itself; creates Notes about its own Person, authored by itself (`comment`; packs that grant more reads add their own comment policies).
- billing: end user reads Invoices, Subscriptions and Payments where `counterparty = @principal.person` or `counterparty in @principal.affiliated_organizations`.
- support: end user reads and creates Tickets where `requester = @principal.person`; reads Messages and Notes with `about` containing one of those Tickets; creates Messages about them.
- content: public reads Documents where `status.category = published` and `published_at <= @now` in Collections with `public = true` (a pack policy, the same shape a public Share compiles to; the server sets `published_at` on the first transition to published when the writer did not; scheduling is a future `published_at`, not a status, which is how WordPress `future` and Ghost `scheduled` behave).
- crm: no end-user policies.

## 5. Shares

A Share record compiles into policies with `principal: {kind: share, value: <share id>}` (or `public`), `applies_to: scope.model`, `actions: permissions`, `where: scope.where` or `{ "id": { "in": ids } }`, `origin: share`, plus, for `email` grantees only, `comment` compiling to `create` on `note` with `author = @principal.person` and `where: { "about": { "any": <the shared ids or the scope> } }`.

Grantees:

- `link`: the token (`<prefix>s_...`) is a credential of kind `share` in `auth_credentials` whose principal is the share (the Share record itself carries no hash, no name and no counter; uses are read from `audit_log`); `Authorization: Bearer <token>` or `/s/{token}/{model}` (`GET .../{model}`, `GET .../{model}/{id}` and `POST .../query`); link shares are read-only.
- `email`: the server sends a magic link to that email (the share counts as an invitation: the guest signs in whatever the workspace's `signup` and `allowed_email_domains` say); nothing is written back to the Share; at request time the share's policies match the identity's lower-cased email or the Person id. A guest is a Person with an Identity and no role. Comment is granted to email grantees only, since a Note has an author (`author = @principal.person`).
- `workspace`: `grantee.value` is another workspace's slug; a workspace-level token is minted for it and delivered out of band (admin copies it); full federation later.
- `public`: no credential; served at `/p/{ws}/{model}` with `Cache-Control: public, s-maxage=60`, `ETag` from the max `updated_at` and count; only `read`.

Expiry and revocation are checked per request (`expires_at`, `status`). Each read through a link, email or workspace share writes an `audit_log` row with `share_id`; `GET /v1/audit?share_id=` lists a share's uses. Reads through the public policy are not attributed to a share.
