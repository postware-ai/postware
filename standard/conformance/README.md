# Conformance

How an implementation proves it follows the standard: load the fixtures through the real write path, then run every test vector. Any implementation may run it and, when it passes, call itself conforming.

## Fixtures (`fixtures/<pack>.jsonl`)

One file per pack (`system`, `core`, `crm`, `billing`, `support`, `content`), one JSON record per line. Records are written **without the envelope**: the engine adds `id`, `model@version`, `workspace`, `revision`, timestamps and principals. Two keys are added for the loader:

- `model`: the bare model name of the record (`"person"`), since a pack file mixes models.
- `$fixture`: a key unique across all fixture files (`"person-ada"`), so other records can reference this one.

References point at fixtures instead of ids: `{ "model": "organization", "$fixture": "org-lumen-harbor" }` anywhere a `ref` is expected (single, in lists, inside inline objects such as `attendees[].ref` or `lines[].product`). The loader creates records in dependency order (a record is created after every record it references; file order is a hint, not a requirement), replaces every `$fixture` reference with the id it was given, and remembers the mapping for the test vectors. `identifiers`, `tags` and `ext` may appear, as on any create.

`core` and `system` are always loaded; a pack file's records may reference them and records of the same pack, never another pack. Fixtures never name real people, companies or domains; domains end in `.example`.

## Test vectors (`tests/*.yaml`)

Each file is a YAML list of cases. Every case has a `name`; the other keys depend on the file. Cases are small and explicit on purpose: one rule each.

### `validation.yaml`

```yaml
- name: person without a name is rejected
  model: person
  record: { emails: [ { value: "ada@lumenharbor.example" } ] }
  valid: false
  error: { code: required, path: name }
```

`record` is a create body. `valid: true` means the create succeeds (201). `valid: false` means a `400 validation_failed` whose `details` contain an entry with exactly this `code` and `path` (paths use dots and zero-based indexes: `lines.0.quantity`). Detail codes used by the suite:

| code | meaning |
|---|---|
| `required` | a required field is absent or null |
| `invalid_type` | the JSON type does not match (a number where a decimal string is expected, a string where an object is) |
| `invalid_enum` | a value outside the closed enum |
| `invalid_status_category` | `status.category` is not one of the model's categories |
| `pattern` | a string does not match its pattern (currency, country) |
| `too_long` | a string over its maximum length |
| `ref_not_found` | a reference's target does not exist |
| `ref_model_not_allowed` | a reference to a model outside the field's `to` list |
| `unknown_field` | a field the model does not declare |
| `extension_undeclared` | an `ext.<ns>.<name>` nobody declared |

### `identity.yaml`

```yaml
- name: two people with the same email merge
  model: person
  a: { ... }
  b: { ... }
  merge: true
```

Create `a`. Then: `record_upsert` with `b` must return `created: false` and the id of `a` when `merge` is true, `created: true` otherwise; and a plain create of `b` must fail `409 duplicate` when `merge` is true, succeed otherwise.

Identity rules are tried in order. A rule matches when every one of its paths has a value on both records and the values are equal; a path that is null on either record never matches (database semantics), so a Document without a `locale` or a draft Invoice without a `number` is matched only through its identifiers. `emails.value` and `domain` identifiers compare case-insensitively; everything else compares exactly. A list path (`emails.value`) matches when any element matches; `identifiers` matches when any `(system, value)` pair is shared.

### `status.yaml`

```yaml
- name: a task cannot be in a category the standard does not know
  model: task
  record: { title: "Ship it", status: { category: flying } }
  valid: false
  error: { code: invalid_status_category, path: status.category }
```

Same semantics as validation, restricted to `Status` fields: categories are validated, `state` labels are free.

### `policy.yaml`

```yaml
- name: end user reads own person
  pack: core
  principal: { kind: end_user, person: { "$fixture": "person-ada" } }
  action: read
  model: person
  record: { "$fixture": "person-ada" }
  allowed: true
```

`principal.kind` is `end_user`, `public`, or `member` with `roles`. For an end user the implementation derives `@principal.affiliated_organizations` from the fixture Person's `affiliations[]`. `record` is a fixture reference for `read`, `update` and `delete`, or an inline create body (with `$fixture` references inside) for `create`; `update` cases also carry `patch`, the partial body to apply. `allowed: false` means a `403 forbidden` for writes (an `update` or `delete` of a record the principal cannot read answers `404 not_found`, as its reads do; either way the record is unchanged) and, for reads, a `404 not_found` on get and an empty list on a query for the record. The default policies of `pack` and of core are installed; no other policy and no share exists.

### `round_trip.yaml`

```yaml
- name: a jsonl export re-imports with ids and identifiers intact
  format: jsonl
  models: [person, organization, invoice]
  fixtures: [core, billing]
  expect: { ids_preserved: true, identifiers_preserved: true, count_equal: true }
```

Load the listed fixture packs into a workspace, export in `format`, import into a fresh workspace, and compare: every record exists with the same `id`, `identifiers`, `tags` and field values, and the counts per model match. For `jsonl` and `csv` every exported record is created again through the ordinary write path with its `id` kept and no identity matching (the importer's `identity: none`). An export of a few models points at records outside it (an Invoice at its Prices, a Document at its Members); the fresh workspace holds those first, transitively and under their original ids, and the listed models arrive only through the export. `refs_resolve` checks that every reference of a re-imported record points at a record the copy has, with the id the source had.
