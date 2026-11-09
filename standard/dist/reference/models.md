# Model reference

Standard 0.1.0. Every model has its own page and its own version. `Req` marks required fields. Types: `string`, `text` (Markdown), `bool`, `int`, `decimal` (string), `date`, `datetime` (with zone), `duration`, `enum(...)`, `Status(...)` (`{category, state?}`), value types, `Ref<X>` (`{model, id}`), `Ref<X>[]`, `object`.

## Models

| Model | Pack | Version | Description |
|---|---|---|---|
| [Collection](models/collection) | [Content](packs/content) | v1 | A set of Documents published together: a site, a blog, a docs tree, a changelog or a help centre, with a slug and a public flag that publishes its published Documents. |
| [Deal](models/deal) | [CRM](packs/crm) | v1 | A potential sale to an Organization or a Person, tracked through a Pipeline, with an amount, a probability and an expected close. |
| [Document](models/document) | [Content](packs/content) | v1 | One piece of content in a Collection: a page, a post, a docs article, a changelog entry or a help article, in Markdown, with a status from draft to published, authors, SEO metadata and an optional parent for hierarchies. |
| [Event](models/event) | [Core](packs/core) | v1 | A scheduled block of time: a meeting, a call, an appointment, a reminder. |
| [File](models/file) | [Core](packs/core) | v1 | Stored or referenced binary content with a name and a type. |
| [Identity](models/identity) | [System](packs/system) | v1 | How a principal authenticates: a provider's stable subject bound to a Member (an operator) or a Person (an end user), with the asserted email and the kinds of factor used. |
| [Import run](models/import_run) | [System](packs/system) | v1 | One execution of an importer: which importer, in which mode, with what outcome and per-model counts. |
| [Invoice](models/invoice) | [Billing](packs/billing) | v1 | A statement of money owed for goods or services: receivable when we issued it, payable when we received it (a bill). |
| [Member](models/member) | [System](packs/system) | v1 | An operator of the workspace: a person on the team, an agent or a service, with roles. |
| [Message](models/message) | [Core](packs/core) | v1 | One message on a channel: an email, a chat message, an SMS, a call record, with sender, recipients, body and the records it is about. |
| [Note](models/note) | [Core](packs/core) | v1 | Free text about one or more records: an internal note, a comment, a meeting summary. |
| [Organization](models/organization) | [Core](packs/core) | v1 | A company, nonprofit, government body or household: a customer, a vendor, a partner or an account. |
| [Payment](models/payment) | [Billing](packs/billing) | v1 | Money that moved against invoices: a customer paying us (receivable), us paying a vendor (payable), or a refund of either. |
| [Person](models/person) | [Core](packs/core) | v1 | A human being: a customer, a contact, an employee, or an end user of the product. |
| [Pipeline](models/pipeline) | [CRM](packs/crm) | v1 | An ordered set of stages that Deals move through, each mapped to one of the standard categories open, won or lost. |
| [Policy](models/policy) | [System](packs/system) | v1 | A rule: which principals may do which actions on which model, narrowed by a filter in the query grammar. |
| [Price](models/price) | [Billing](packs/billing) | v1 | An amount at which a Product is sold, once or on a recurring interval. |
| [Product](models/product) | [Core](packs/core) | v1 | A thing the business sells or buys: a good, a service or a digital item. |
| [Project](models/project) | [Core](packs/core) | v1 | A container of work with a lifecycle: planned, active, paused, done or cancelled. |
| [Share](models/share) | [System](packs/system) | v1 | A grant of read, and optionally comment, access to records, by ids or by filter, to someone outside the workspace: a link, an email, another workspace or the public. |
| [Subscription](models/subscription) | [Billing](packs/billing) | v1 | A recurring agreement to bill (receivable) or be billed (payable) for Prices, period after period. |
| [Tag](models/tag) | [System](packs/system) | v1 | A label that works the same on every record: a namespaced slug with a display name, a colour and a description. |
| [Task](models/task) | [Core](packs/core) | v1 | A unit of work with a status, a priority, assignees and a due date. |
| [Tax rate](models/tax_rate) | [Billing](packs/billing) | v1 | A named tax percentage applied to invoice lines (VAT 20%, GST 5%, a state sales tax), referenced by Products and Invoice lines. |
| [Team](models/team) | [Core](packs/core) | v1 | A named group of Members that work is assigned to. |
| [Ticket](models/ticket) | [Support](packs/support) | v1 | A request for help from a Person, owned by the team until it is solved. |
| [Workspace](models/workspace) | [System](packs/system) | v1 | The tenant: one company or one person, holding exactly one of these records, its first. |

## The envelope, on every record

Every record of every model carries these fields alongside its own. The server sets `model`, `workspace`, `revision`, the timestamps and `created_by` and `updated_by`, and generates `id` when you leave it out. You can write `owner`, `identifiers`, `tags` and `ext`. Importers fill in `source`.

| Field | Type | Req | Notes |
|---|---|---|---|
| `id` | ULID | yes | ULID; generated when absent |
| `model` | string | yes | name@version |
| `workspace` | string | yes | the Workspace record id |
| `revision` | int | yes | optimistic concurrency with If-Match |
| `created_at` | datetime | yes |  |
| `updated_at` | datetime | yes |  |
| `created_by` | object | yes | {kind: member\|person\|share\|system, id} |
| `updated_by` | object | yes | {kind, id} |
| `owner` | string | no | Member id, the accountable operator |
| `identifiers` | Identifier[] | no | Identifier[]: the crosswalk |
| `tags` | string[] | no | tag slugs, `namespace:slug` form |
| `ext` | object | no | declared extensions only |
| `source` | object | no | {system, external_id, created_at, updated_at, deleted_at?, import_run, imported_at, payload} |
| `deleted_at` | datetime | no | soft delete |

## Value types (embedded, never records)

Reusable shapes that sit inside a field, such as a Money amount or an Address. The model tables below refer to them by name. They have no id or endpoint of their own: they are saved with the record that holds them, and you filter on them through its field, for example `emails.value`. A `?` marks an optional property.

| Type | Shape |
|---|---|
| `Identifier` | `{system: string, value: string, primary?: bool}`; An external or natural key. `system` is a registered scheme (email, domain, vat:eu, sha256, stripe:customer, postware:workspace). |
| `Name` | `{full: string, given?: string, family?: string, middle?: string, prefix?: string, suffix?: string, nickname?: string}`; A human name (vCard, FHIR HumanName). |
| `ContactPoint` | `{value: string, label?: enum(work\|home\|mobile\|fax\|billing\|other), primary?: bool, verified_at?: datetime}`; One email, phone or URL; used by the emails[], phones[] and urls[] arrays. |
| `Address` | `{lines: string[], locality?: string, region?: string, postal_code?: string, country: string, kind?: enum(billing\|shipping\|mailing\|home\|work\|other), primary?: bool, geo?: {lat: decimal, lon: decimal}}` |
| `Money` | `{amount: decimal, currency: string}` |
| `Period` | `{start: datetime, end?: datetime}` |
| `Status` | `{category: string, state?: string}`; category is the standard (validated per model); state is the workspace's own label. |
| `Affiliation` | `{organization: Ref<Organization>, role?: enum(employee\|contractor\|owner\|contact\|member\|other), primary?: bool, period?: Period}`; A person's membership of an organization; the job title lives on the Person. |
| `Recurrence` | `{rrule: string}` |
| `Scope` | `{model: string, ids?: string[], where?: }` |
| `Grantee` | `{kind: enum(link\|email\|workspace\|public), value?: string}` |
| `SEO` | `{title?: string, description?: string, canonical_url?: string, no_index?: bool}` |
| `Participant` | `{ref?: Ref<Person \| Member>, name?: string, address?: string, role?: string, status?: enum(accepted\|declined\|tentative\|needs_action)}`; A person or address taking part in a message or an event (an RFC 5322 mailbox, a JMAP EmailAddress, an iCalendar ATTENDEE or ORGANIZER). Every field is optional; ref names the Person or Member when one is known, address carries the email, phone number or handle as the channel wrote it. |

## Contributed extensions

Optional, typed fields that packs add to a model without changing the model itself. They live under the record's `ext` field and are addressed as `ext.<namespace>.<name>`, for example `ext.crm.lifecycle_stage`, and you filter on them like any other field. Each row names the model it applies to. A write that uses an extension nobody declared is refused; declare your own for a workspace with `POST /v1/schema/extensions`.

### [Deal](models/deal)

| Extension | Type | Notes |
|---|---|---|
| `ext.crm.deal_source` | string | Where this deal came from: the channel, campaign or referral that produced the opportunity. Named deal_source because the envelope's source object holds import provenance. |
| `ext.crm.line_items` | object | The products on the deal before a quote or invoice exists: an object { lines: [ { product (a Product id), description, quantity (decimal string), unit_price { amount, currency } } ] }. Quantities and prices belong on the Invoice once one exists. |
| `ext.crm.lost_reason` | string | Why the deal was lost, in the team's own words or vocabulary. |
| `ext.crm.won_reason` | string | Why the deal was won, in the team's own words or vocabulary. |

### [Event](models/event)

| Extension | Type | Notes |
|---|---|---|
| `ext.calendar.exdates` | string | RFC 5545 EXDATE: the occurrences of the series that are removed, as a comma-separated list of date-times. |
| `ext.calendar.rdates` | string | RFC 5545 RDATE: extra occurrences added to the series, as a comma-separated list of date-times. |
| `ext.calendar.recurrence_id` | datetime | RFC 5545 RECURRENCE-ID on a modified occurrence: the original start of the instance this record overrides; the series master is found by the shared ical:uid identifier. |
| `ext.calendar.reminders` | object | Alarms before the event: { overrides: [ { method (popup, email), minutes_before (int) } ] }; absent means the calendar's default. |
| `ext.calendar.transparency` | enum(opaque\|transparent) | RFC 5545 TRANSP: whether the event blocks time (opaque) or not (transparent). |
| `ext.calendar.visibility` | enum(public\|private\|confidential) | RFC 5545 CLASS: who may see the details. |

### [Invoice](models/invoice)

| Extension | Type | Notes |
|---|---|---|
| `ext.billing.exchange_rate` | decimal | The rate from the invoice currency to the workspace's reporting currency at issue, as a decimal string. |

### [Message](models/message)

| Extension | Type | Notes |
|---|---|---|
| `ext.messaging.received_at` | datetime | When the receiving system accepted the message (the Received trace, Gmail internalDate, Graph receivedDateTime); sent_at orders the thread, this records delivery. |
| `ext.messaging.references` | string | The RFC 5322 References header as written: the Message-IDs of the thread's ancestors, space-separated, for rebuilding threads of imported mail. |

### [Organization](models/organization)

| Extension | Type | Notes |
|---|---|---|
| `ext.billing.legal_name` | string | The registered legal name, when it differs from name; printed on invoices and used by the e-invoicing profile. |
| `ext.crm.annual_revenue` | Money | Annual revenue as Money { amount, currency }, as reported or estimated. |
| `ext.crm.employees` | int | Number of employees; a band from the source (1-10, 11-50) is kept in source.payload. |
| `ext.crm.industry` | string | The organization's industry in the workspace's own vocabulary; every CRM ships a different picklist. |
| `ext.crm.lifecycle_stage` | enum(subscriber\|lead\|marketing_qualified_lead\|sales_qualified_lead\|opportunity\|customer\|evangelist\|other) | Where this organization stands in the marketing and sales lifecycle, from subscriber to evangelist. |

### [Person](models/person)

| Extension | Type | Notes |
|---|---|---|
| `ext.crm.lifecycle_stage` | enum(subscriber\|lead\|marketing_qualified_lead\|sales_qualified_lead\|opportunity\|customer\|evangelist\|other) | Where this person stands in the marketing and sales lifecycle, from subscriber to evangelist (the HubSpot stages, snake_case). A lead is a Person with lifecycle_stage lead; there is no Lead model. |
| `ext.crm.source` | string | Where this person came from: the channel or campaign that produced the contact (organic search, referral, event, paid social). |

### [Price](models/price)

| Extension | Type | Notes |
|---|---|---|
| `ext.billing.tiers` | object | Tiered or volume pricing: { scheme (graduated \| volume), tiers: [ { up_to (decimal string or null for the last tier), unit_amount { amount, currency }, flat_amount { amount, currency } } ] }. |
| `ext.billing.trial_days` | int | Free trial length in days granted when a subscription starts on this price. |
| `ext.billing.usage_based` | bool | True when the quantity billed each period comes from metered usage rather than a fixed quantity. |

### [Product](models/product)

| Extension | Type | Notes |
|---|---|---|
| `ext.catalog.image` | string | The id of the File holding the product image. |

### [Task](models/task)

| Extension | Type | Notes |
|---|---|---|
| `ext.work.estimate` | duration | The effort estimate as an ISO 8601 duration; points and other units stay in source.payload. |
| `ext.work.rank` | string | Manual ordering key within a view; lexicographic. |
| `ext.work.recurrence` | Recurrence | An RFC 5545 RRULE for a task that recurs on completion; natural-language rules are translated or kept in source.payload. |
| `ext.work.start` | datetime | When work is planned to start. |

### [Tax rate](models/tax_rate)

| Extension | Type | Notes |
|---|---|---|
| `ext.billing.jurisdiction` | object | Where the rate applies: { country (ISO 3166-1 alpha-2), region }. |
| `ext.billing.tax_kind` | enum(vat\|gst\|sales_tax\|other) | The kind of tax the rate is: VAT, GST, a sales tax, or another. |

### [Team](models/team)

| Extension | Type | Notes |
|---|---|---|
| `ext.org.kind` | enum(team\|department\|cost_center\|business_unit\|group) | What kind of group this is in the organization chart. |
| `ext.org.lead` | string | The id of the Member who leads the team; the envelope's owner is the accountable operator of the record itself. |
| `ext.org.parent` | string | The id of the parent Team in the hierarchy. |

### [Ticket](models/ticket)

| Extension | Type | Notes |
|---|---|---|
| `ext.support.cc` | object | People copied on the whole ticket rather than on single messages: { participants: [ Participant ] }. |
| `ext.support.first_responded_at` | datetime | When the team first replied to the requester; the start of SLA reporting. |
| `ext.support.kind` | string | The ticket type in the source's vocabulary: question, incident, problem, task, feedback, or a workspace's own. |
| `ext.support.parent` | string | The id of the parent Ticket (a problem this incident belongs to, a tracker, a follow-up source). |
| `ext.support.satisfaction` | object | The requester's rating after resolution: { rating (int, 1 to 5), comment }. |
