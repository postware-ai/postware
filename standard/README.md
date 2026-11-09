# The standard

The open part of the project: business data models that any server, importer or agent can implement, read and extend without using our code. This directory is the source of truth. Nothing else defines a model, and the compiled artifacts in `dist/` are generated from it. Licence: Apache-2.0 (`../LICENSE`).

## Layout

| Path | Holds |
|---|---|
| `models/<group>/<name>.yaml` | one model per file in the meta-schema of `../docs/spec/01-schema.md`: URN, name, title, version, group, description, `agent_context`, identity rules, status categories, fields, sensitivity, events |
| `types.yaml` | the value types every model embeds: `Identifier`, `Name`, `ContactPoint`, `Address`, `Money`, `Period`, `Status`, `Affiliation`, `Recurrence`, `Scope`, `Grantee`, `SEO`, `Participant` |
| `extensions/<namespace>/<name>.yaml` | published extension declarations: typed, namespaced attributes stored under `ext.<namespace>.<name>` on a record, one file per declared name (a file named after the model may hold several) |
| `policies/<pack>.yaml` | the default Policy records a pack installs into a workspace, as a list of Policy documents |
| `importers/<source>.yaml` | importer manifests: how a source maps onto models (`csv.yaml` in 0.1) |
| `conformance/fixtures/<pack>.jsonl` | fixture records per pack, one JSON record per line |
| `conformance/tests/*.yaml` | test vectors: validation, identity, status, policy, round trip (`conformance/README.md` defines the formats) |
| `dist/` | compiled artifacts: `jsonschema/<name>.json`, `types.json`, `openapi.json`, `mcp-tools.json`, `models.md`, `api.md`, `policies/<pack>.json`, and `reference/`: one page per model at each version (`models/<name>/v<major>.md`), one per pack, and `index.json` |
| `CHANGELOG.md` | every change to the standard, by version |

## Groups and models

| Group | Models |
|---|---|
| `system` | workspace, member, identity, policy, share, tag, import_run |
| `core` | person, organization, team, project, task, event, note, message, file, product |
| `crm` | pipeline, deal |
| `billing` | price, subscription, invoice, payment, tax_rate |
| `support` | ticket |
| `content` | collection, document |

The system and core groups are present in every workspace. The other four are packs: a pack is a set of models, contributed extensions, default policies and importer manifests that replaces one category of software. Packs reference core models; they never own them.

Three rules hold across every model. Every workflow state is a `Status {category, state}`: the category is the standard's, the state label is the workspace's or the source's own word. Every enum is closed on the standard side and the vendor's own value is kept beside it when imported (in `source.payload`, or in the Status `state`). Every amount of money is a `Money {amount, currency}` with the amount as a decimal string, never a float.

The core is deliberately small: a field is core when leading products and open vocabularies agree on it and a small business needs it on day one; everything else is a declared extension.

## URNs

Every model, field and extension has a URN. URNs carry the product name, not a domain, so the brand and domain can change without touching the standard, and they resolve at `{API_BASE_URL}/schema/...` on any server.

| Thing | URN |
|---|---|
| a model | `urn:postware:<group>:<name>`, e.g. `urn:postware:core:person` |
| a specific major version | `urn:postware:<group>:<name>@<major>`, e.g. `urn:postware:billing:invoice@1` |
| a field | `urn:postware:<group>:<name>#<field>`, e.g. `urn:postware:core:person#emails` |
| an extension | `urn:postware:ext:<namespace>:<name>`, e.g. `urn:postware:ext:crm:lifecycle_stage` |

The URN is the identity; the `name` in the YAML is a label. Routes, MCP tools and SDK types are generated from the label, so renaming a model (`deal` to `opportunity`) is one line with the URN unchanged.

## Versioning

Models are versioned by major, in the URN. The standard as a whole has a semantic version (0.1.0 today); packs are versioned with the standard. Every release is checked against the previous one by these rules:

- **Minor** (additive, compatible in both directions): adding an optional field, an enum value, an index, an event, a new model, a new extension declaration, a new default policy. Minor changes are recorded in `CHANGELOG.md` and need no RFC.
- **Major** (a new URN version; the RFC that introduces it says how records move): making a field required, removing or renaming a field, removing an enum value, changing a type, changing identity rules. Majors start as an RFC (below).
- **Labels** (`name`, `title`) may change at any time; routes, tools and SDK types follow the label, and old labels are accepted as aliases for one minor version.

Compatibility means BACKWARD and FORWARD within a major: a record written by an implementation on 1.3 is readable by one on 1.2, and the other way round. An implementation on a previous major that meets a record on a new one applies the migration rule or rejects the record; it never guesses.

## Identity rules and identifier systems

Each model lists identity rules, tried in order; each rule is a list of paths that must all match. A rule matches when every path has a value on both records and the values are equal (a null never matches, as in a database unique index), so a record whose natural key is incomplete is matched only through its identifiers. `emails.value` matches any element; `identifiers` matches any shared `(system, value)` pair.

`identifiers[]` on the envelope is the crosswalk between records and the outside world; each entry is `{system, value, primary?}` and `(system, value)` is unique per model inside a workspace. Systems are lowercase; `:` separates a namespace from a name. The registered systems in 0.1:

| System | Value | Used by |
|---|---|---|
| `email` | an email address, compared case-insensitively | person (also the `emails[]` field) |
| `domain` | a registrable domain, lowercase, compared case-insensitively | organization |
| `vat:<cc>` | a VAT registration number in the given country (`vat:eu` for the EU format) | organization |
| `duns`, `lei` | D-U-N-S number, Legal Entity Identifier | organization |
| `sku` | a stock-keeping unit | product |
| `email:message-id` | the RFC 5322 Message-ID without angle brackets | message |
| `slack:ts` | `<channel>/<ts>` | message |
| `ical:uid` | the iCalendar UID of a series | event |
| `sha256`, `md5`, `sha1`, `crc32`, `quickxor`, `dropbox:content-hash` | a content hash, lowercase hex (the server adds `sha256` for every file it stores) | file |
| `postware:workspace` | `<origin workspace slug>/<record id>`: the origin of a record copied from another workspace | any |
| `<source>:<object>` | a source system's own id, e.g. `stripe:customer`, `hubspot:contact`, `quickbooks:invoice`, `jira:issue-key`, `linear:team-key` | importers |

New systems are added here by pull request; an unknown system is accepted by the server and compared exactly.

## Tags

A tag is `[namespace:]slug`. The slug is `segment(/segment)*` with each segment `[a-z0-9][a-z0-9_-]{0,63}`, the whole slug at most 255 characters, lowercase, compared case-insensitively; `/` is the only hierarchy operator (`customers/vip`, `docs/getting-started`). The namespace is `[a-z][a-z0-9-]{0,31}`; none means a workspace-local tag. Reserved namespaces: `sys` for the server (`sys:imported`, `sys:duplicate-candidate`), a pack's name for the few tags a pack ships, and each importer's source name for source labels kept losslessly (`hubspot:lists/newsletter`, `gmail:important`, `zendesk:vip_customer`), so nothing from a source is dropped and nothing from a source pollutes the workspace's own vocabulary. `name` is the display form and may carry case and spaces ("Dark Side" has slug `dark-side`); `color` is `#RRGGBB`. Anything the standard depends on is a field or a `Status`, never a tag.

## Extensions

Declared extensions are typed attributes under `ext.<namespace>.<name>`, filterable like core fields (`{ "ext.crm.lifecycle_stage": "lead" }`). A declaration carries `model`, `namespace`, `name`, `type`, `description`, `enum` for enum types and `index`; it carries no reference type, so an extension that points at a record holds the id as a string. The published namespaces in 0.1:

| Namespace | On | Declares |
|---|---|---|
| `crm` | person, organization, deal | `lifecycle_stage`, `source`, `deal_source`, `won_reason`, `lost_reason`, `line_items`, `industry`, `employees`, `annual_revenue` |
| `billing` | price, invoice, tax_rate, organization | `usage_based`, `tiers`, `trial_days`, `exchange_rate`, `tax_kind`, `jurisdiction`, `legal_name` |
| `catalog` | product | `image` |
| `support` | ticket | `kind`, `first_responded_at`, `satisfaction`, `cc`, `parent` |
| `messaging` | message | `received_at`, `references` |
| `work` | task | `start`, `estimate`, `rank`, `recurrence` |
| `calendar` | event | `exdates`, `rdates`, `recurrence_id`, `reminders`, `visibility`, `transparency` |
| `org` | team | `kind`, `parent`, `lead` |

Workspaces declare their own through the schema API (`POST /v1/schema/extensions`); importers keep each source's raw payload in `source.payload`. Promotion to core happens by observed use, through an RFC.

## Policies in the standard

`policies/<pack>.yaml` holds the Policy records a pack installs. Their `where` objects are written in the query grammar (`../docs/spec/02-query.md`) with the variables of `../docs/spec/04-policy-share.md` section 2 (`@principal.person`, `@principal.member`, `@principal.identity`, `@principal.affiliated_organizations`, `@share.id`, `@now`). One convention, from 04 section 5, is used where a filter must follow a reference: the operand of `in` (single references) or `any` (reference lists) may be a `Scope` object `{model, where}` instead of a list of ids, meaning "the ids of the records matching that scope". Shares compile to the same form.

## Conformance

`conformance/` is how an implementation proves it follows the standard: fixture datasets per pack and test vectors for validation, identity resolution, status mapping, policy evaluation and the export and re-import round trip. The formats are defined in `conformance/README.md`. An implementation that loads the fixtures through its real write path and passes every vector may call itself conforming; Postware runs the suite on every release.

## Proposing a change

Additive changes are a pull request: the YAML change, the fixtures and vectors that exercise it, the regenerated `dist/`, and a `CHANGELOG.md` entry. Anything that is a major under the rules above, and any new model or pack, starts as an RFC: copy the template in `../rfcs/README.md` to `../rfcs/NNNN-short-title.md`, open a pull request with it, and implement it once accepted. Discussion happens on the pull request.

When in doubt, a field is an extension, not a core field. Extensions are typed, namespaced and declared, so nothing is lost by starting there.

## Licence

Apache License, Version 2.0: `../LICENSE`. Everything in this directory, including the compiled artifacts, the fixtures and the importer manifests, may be used, copied, modified and redistributed under it, so that the standard itself never closes.
