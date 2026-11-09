# Changelog: the standard

Every change to `standard/`, by standard version. Each model carries its own major in its URN (`@1`); the standard's version covers the whole set and the packs are versioned with it. Minor versions are additive; a major is a new URN version introduced by an RFC that states how records move (there is no migrations folder).

## 0.1.0 - 2026-11-06

The first published version: twenty-seven models in six groups, all at major version 1. The field sets follow the model research of 6 November 2026 (vendor APIs, unified-API models and open vocabularies, in `research/models/` of the proposal repository): a field is core when the leading products agree on it and a small business needs it on day one; everything else is a declared extension.

### Changed (9 November 2026)

- `importers/csv.yaml`: `dry_run` defaults to true, matching the `import_run` tool; a write asks for `dry_run: false`.
- `models/billing/invoice.yaml`: a line's `amount` is described as the total as billed; it is not checked against quantity and unit price.

### Changed (6 November 2026, after the first build)

- `models/system/workspace.yaml`: the description no longer names the storage engine; where a workspace lives is the host's business, not the standard's.
- `dist/reference/`: the reference is generated per page: one file per model at each major version, one per pack, and `index.json`.
- `extensions/billing/usage_based.yaml`: the description says what the field means and nothing about future work.
- `policies/core.yaml`: the end user's comment policy lists `author` among its fields, so the Note it is allowed to create can be created (Note requires `author`).
- `models/system/share.yaml` and `models/content/collection.yaml`: publishing is the Content pack's public policy, not a Share record; `public: true` on a Collection makes its published Documents publicly readable. Comment on a Share is granted to email grantees only, because a Note has an author.
- `importers/csv.yaml`: `mapping.identity` is `none` (create every row) or `identity` (upsert by every identity rule); the earlier `email`, `domain`, `identifiers` and named-rule values are gone. Every written record carries `source = {system, external_id, import_run, imported_at, payload}` and the tag `sys:imported`; a dry run saves nothing and returns the would-be ImportRun without an id; `name.full` is derived from the name parts when absent.
- Reserved tag namespaces are enforced: `sys:` and the packs' names are the server's; a write that would create a tag there answers `reserved_namespace`.

### Added

- **Value types** (`types.yaml`): `Identifier`, `Name`, `ContactPoint` (labels work, home, mobile, fax, billing, other), `Address` (kinds billing, shipping, mailing, home, work, other), `Money`, `Period`, `Status`, `Affiliation`, `Recurrence`, `Scope`, `Grantee`, `SEO`, `Participant` (a sender, recipient, organizer or attendee: `ref`, `name`, `address`, `role`, `status`).
- **System** (7): `workspace` (`urn:postware:system:workspace`), `member` (`urn:postware:system:member`), `identity` (`urn:postware:system:identity`), `policy` (`urn:postware:system:policy`), `share` (`urn:postware:system:share`), `tag` (`urn:postware:system:tag`), `import_run` (`urn:postware:system:import_run`). Workspace, Member, Identity and Share carry a `Status`; the hosting concerns of a Workspace are the `cloud` extension pack.
- **Core** (10): `person` (`urn:postware:core:person`), `organization` (`urn:postware:core:organization`), `team` (`urn:postware:core:team`), `project` (`urn:postware:core:project`), `task` (`urn:postware:core:task`), `event` (`urn:postware:core:event`), `note` (`urn:postware:core:note`), `message` (`urn:postware:core:message`), `file` (`urn:postware:core:file`), `product` (`urn:postware:core:product`).
- **CRM pack** (2): `pipeline` (`urn:postware:crm:pipeline`), `deal` (`urn:postware:crm:deal`).
- **Billing pack** (5): `price` (`urn:postware:billing:price`), `subscription` (`urn:postware:billing:subscription`), `invoice` (`urn:postware:billing:invoice`), `payment` (`urn:postware:billing:payment`), `tax_rate` (`urn:postware:billing:tax_rate`). One Invoice and one Payment model carry both ledger sides through `direction: receivable | payable`; refunds are Payments of `kind: refund`.
- **Support pack** (1): `ticket` (`urn:postware:support:ticket`); the conversation is Messages about the ticket, internal notes are Notes about it.
- **Content pack** (2): `collection` (`urn:postware:content:collection`), `document` (`urn:postware:content:document`); scheduling is a future `published_at`.
- **Events**: `invoice.paid`, `deal.won`, `ticket.solved`, `subscription.cancelled`, `document.published`, in addition to `<model>.created`, `.updated` and `.deleted` on every model.
- **Extension packs** (`extensions/`): `crm` (`lifecycle_stage` on person and organization, `source`, `deal_source`, `won_reason`, `lost_reason`, `line_items`, `industry`, `employees`, `annual_revenue`), `billing` (`usage_based`, `tiers`, `trial_days` on price; `exchange_rate` on invoice; `tax_kind`, `jurisdiction` on tax_rate; `legal_name` on organization), `catalog` (`image` on product), `support` (`kind`, `first_responded_at`, `satisfaction`, `cc`, `parent` on ticket), `messaging` (`received_at`, `references` on message), `work` (`start`, `estimate`, `rank`, `recurrence` on task), `calendar` (`exdates`, `rdates`, `recurrence_id`, `reminders`, `visibility`, `transparency` on event), `org` (`kind`, `parent`, `lead` on team).
- **Default policies** (`policies/`): core (an end user reads and updates its own Person, reads its own Notes, comments on its own Person), billing (an end user reads the Invoices, Subscriptions and Payments it or an affiliated Organization is the counterparty of), support (an end user reads and creates its own Tickets, reads the Messages and shared Notes about them, sends Messages about them), content (the public reads published Documents whose `published_at` has passed in public Collections, and the public Collections themselves); crm ships none.
- **Importer manifest** `importers/csv.yaml`: the CSV mapping object with two example mappings.
- **Conformance**: fixtures per pack (`conformance/fixtures/`) and test vectors (`conformance/tests/`) for validation, identity, status, policy and round trip; formats in `conformance/README.md`.
- **Tag grammar**: `[namespace:]segment(/segment)*`, segments `[a-z0-9][a-z0-9_-]{0,63}`, at most 255 characters, compared case-insensitively; colours `#RRGGBB`.
