# 01. The schema: meta-schema, value types, compiled artifacts

Status: engineering spec for v0.1. The standard's source of truth is `standard/models/**/*.yaml`; nothing else defines a model.

## 1. Model file (meta-schema)

One YAML file per model (plain scalars that contain `: ` or `, ` must be quoted; nested objects use block style). Field names are the labels the API, routes, tools and SDK use; the URN is the identity. Renaming a field or a model is a change to `name` with the URN unchanged.

```yaml
urn: urn:postware:core:person        # stable identity; never changes within a major
name: person                           # API name: singular, snake_case; used in routes, tools and the SDK
title: Person                          # display
version: 1                             # major; minor changes are additive and tracked in CHANGELOG
group: core                            # system | core | crm | billing | support | content
description: "A human being: a customer, a contact, an employee, or an end user of the product."
agent_context: |                        # read by agents through schema_describe; plain prose
  Use Person for any human. Dedupe by email. An end user of the product is a Person with an Identity.
identity:                              # dedupe / upsert rules, tried in order; each rule is a list of paths that must all match
  - [emails.value]                     # any email, case-insensitive (ContactPoint lists match on any element)
  - [identifiers]                      # any identifier with the same system and value
status:                                # present only when the model has a `status: Status` field
  categories: [open, in_progress, blocked, done, cancelled]
fields:
  name:        { type: Name, required: true }
  emails:      { type: ContactPoint, list: true }
  addresses:   { type: Address, list: true }
  affiliations: { type: Affiliation, list: true, description: "Organizations this person belongs to, with role and period" }
  avatar:      { type: ref, to: [file] }
  birthday:    { type: date }
  locale:      { type: string }
  description: { type: text }
  kind:        { type: enum, values: [good, service, digital], required: true }
  amount:      { type: Money }
  organization:{ type: ref, to: [organization] }
  counterparty:{ type: ref, to: [organization, person], required: true }
  about:       { type: ref, to: any, list: true }
  lines:
    type: object
    list: true
    required: true
    fields:
      product:     { type: ref, to: [product] }
      description: { type: string, required: true }
      quantity:    { type: decimal, required: true }
      unit_price:  { type: Money, required: true }
      amount:      { type: Money, required: true }
  rate:        { type: decimal, required: true, description: "Percent" }
  size:        { type: int }
  active:      { type: bool, required: true, default: true }
sensitivity:                           # per field: public | internal | confidential; default internal
  birthday: confidential
events:                                # declared transitions that emit named events
  - { field: status.category, to: paid, name: invoice.paid }
```

### 1.1 Field types

| `type` | JSON | Notes |
|---|---|---|
| `string` | string | max 4,000 chars unless `max` given |
| `text` | string | Markdown, unbounded (10 MB cap) |
| `bool` | boolean | |
| `int` | integer | int64 |
| `decimal` | string | decimal string, e.g. `"19.99"`; never a float |
| `date` | string | `YYYY-MM-DD` |
| `datetime` | string | RFC 3339 with offset |
| `duration` | string | ISO 8601 duration, e.g. `PT2H` |
| `enum` | string | `values: [...]`, closed |
| `object` | object | inline `fields:`; `list: true` for arrays of objects |
| `ref` | object | `{ "model": "organization", "id": "01J..." }`; `to: [names]` or `to: any` |
| value types | object | `Identifier`, `Name`, `ContactPoint`, `Address`, `Money`, `Period`, `Status`, `Affiliation`, `Recurrence`, `Scope`, `Grantee`, `SEO`, `Participant` (defined once in `standard/types.yaml`) |

`list: true` makes any type an array. `required: true` means present and non-null on create. `default` applies on create when absent.

### 1.2 Value types (`standard/types.yaml`)

Defined with the same `fields:` syntax, e.g.

```yaml
Money:      { fields: { amount: { type: decimal, required: true }, currency: { type: string, required: true, pattern: "^[A-Z]{3}$" } } }
Status:     { fields: { category: { type: string, required: true }, state: { type: string } } }   # category validated against the model's status.categories
Identifier: { fields: { system: { type: string, required: true }, value: { type: string, required: true }, primary: { type: bool } } }
```

`Status.category` is validated per model from `status.categories`. `Ref.model` is validated against `to`.

## 2. The envelope

Every record, regardless of model, carries exactly these fields; they are part of every JSON Schema. `id` (ULID), `model` (`name@version`), `workspace`, `revision`, `created_at`, `updated_at`, `created_by`, `updated_by` (both `{kind: member|person|share|system, id}`), `owner` (member id, optional), `identifiers[]`, `tags[]` (tag slugs with namespace, e.g. `customers/vip`, `hubspot:lists/newsletter`), `ext` (object), `source` (object), `deleted_at`.

On the wire, `tags` are slugs (strings), not Tag ids; the server resolves them.

## 3. Compiled artifacts (committed to `standard/dist/`)

- `jsonschema/<name>.json`: JSON Schema 2020-12 per model, `$id` = the URN, envelope included, value types as `$defs`.
- `openapi.json`: OpenAPI 3.1 for the HTTP API with one path set per model.
- `mcp-tools.json`: the eleven tool definitions with bare names and input schemas.
- `models.md`: the model reference, one table per model in the Appendix A format of the proposal.
- `types.json`: value types.
- `policies/<pack>.json`: the compiled default policies.

## 4. Versioning rules (checked on every release)

- Adding an optional field, an enum value, an index, an event, or a new model: minor.
- Making a field required, removing or renaming a field, removing an enum value, changing a type, changing identity rules: major (new URN version); how records move between majors is documented with the change (an RFC in `rfcs/`).
- `name` (the label) may change at any time; routes, tools and SDK types follow the label. Old labels are accepted as aliases for one minor version.
