# Model reference

Standard 0.1.0. Every attribute of every model in one place. `Req` marks required fields. Types: `string`, `text` (Markdown), `bool`, `int`, `decimal` (string), `date`, `datetime` (with zone), `duration`, `enum(...)`, `Status(...)` (`{category, state?}`), value types, `Ref<X>` (`{model, id}`), `Ref<X>[]`, `object`.

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

## Collection

`pack:Content` `urn:postware:content:collection`, identity: `slug`

A set of Documents published together: a site, a blog, a docs tree, a changelog or a help centre, with a slug and a public flag that publishes its published Documents.

| Field | Type | Req | Notes |
|---|---|---|---|
| `name` | string | yes |  |
| `slug` | string | yes | pattern `^[a-z0-9]+(-[a-z0-9]+)*$` |
| `kind` | enum(site\|blog\|docs\|changelog\|help\|other) | no | default `other` |
| `description` | text | no |  |
| `public` | bool | yes | makes its published Documents publicly readable through the Content pack's public policy; default `false` |

## Deal

`pack:CRM` `urn:postware:crm:deal`, identity: `identifiers`; status categories: `open`, `won`, `lost`

A potential sale to an Organization or a Person, tracked through a Pipeline, with an amount, a probability and an expected close. Won or lost is the status category.

| Field | Type | Req | Notes |
|---|---|---|---|
| `name` | string | yes |  |
| `organization` | Ref<Organization> | no |  |
| `people` | object[] | no | `{person: Ref<Person>, primary?: bool, role?: string}` |
| `pipeline` | Ref<Pipeline> | yes |  |
| `stage` | string | yes | a stage key of the pipeline |
| `status` | Status(open\|won\|lost) | yes | category defaults from the stage's category; default `map[category:open]` |
| `amount` | Money | no |  |
| `probability` | decimal | no | 0 to 1; defaults from the stage |
| `expected_close` | date | no |  |
| `closed_at` | datetime | no | set when status.category leaves open |
| `description` | text | no |  |

Events: `deal.won` when `status.category` becomes `won`; `deal.lost` when `status.category` becomes `lost`.

## Document

`pack:Content` `urn:postware:content:document`, identity: `collection + slug + locale`; status categories: `draft`, `review`, `published`, `archived`

One piece of content in a Collection: a page, a post, a docs article, a changelog entry or a help article, in Markdown, with a status from draft to published, authors, SEO metadata and an optional parent for hierarchies.

| Field | Type | Req | Notes |
|---|---|---|---|
| `collection` | Ref<Collection> | yes |  |
| `title` | string | yes |  |
| `slug` | string | yes | pattern `^[a-z0-9]+(-[a-z0-9]+)*$` |
| `body` | text | no | Markdown; a source's native rich text stays in source.payload |
| `summary` | text | no |  |
| `status` | Status(draft\|review\|published\|archived) | yes | default `map[category:draft]` |
| `published_at` | datetime | no | set by the server on the first transition to published when absent; a future value schedules |
| `authors` | Ref<Member \| Person>[] | yes | at least one |
| `cover` | Ref<File> | no |  |
| `seo` | SEO | no |  |
| `locale` | string | no | BCP 47 |
| `parent` | Ref<Document> | no | docs hierarchy |
| `order` | int | no |  |

Events: `document.published` when `status.category` becomes `published`.

## Event

`pack:Core` `urn:postware:core:event`, identity: `identifiers`; status categories: `confirmed`, `tentative`, `cancelled`

A scheduled block of time: a meeting, a call, an appointment, a reminder. One record per series; a logged call or meeting is an Event too.

| Field | Type | Req | Notes |
|---|---|---|---|
| `title` | string | no |  |
| `description` | text | no |  |
| `period` | Period | yes | start inclusive; end exclusive, omitted for a zero-duration event |
| `timezone` | string | no | IANA zone of start and end |
| `all_day` | bool | no | default `false` |
| `status` | Status(confirmed\|tentative\|cancelled) | yes | default `map[category:confirmed]` |
| `location` | string | no |  |
| `conference_url` | string | no |  |
| `organizer` | Participant | no |  |
| `attendees` | Participant[] | no |  |
| `recurrence` | Recurrence | no |  |
| `about` | Ref<any>[] | no |  |

## File

`pack:Core` `urn:postware:core:file`, identity: `identifiers`

Stored or referenced binary content with a name and a type. The bytes live in object storage or on disk; the record holds the name, type, size and location.

| Field | Type | Req | Notes |
|---|---|---|---|
| `name` | string | yes |  |
| `mime_type` | string | yes | detected by the server; importers fall back to the extension or application/octet-stream |
| `size` | int | no | bytes; absent for native cloud documents |
| `storage` | object | yes | `{provider: string, key: string}` |
| `about` | Ref<any>[] | no |  |

## Identity

`pack:System` `urn:postware:system:identity`, identity: `provider + subject`; status categories: `active`, `disabled`

How a principal authenticates: a provider's stable subject bound to a Member (an operator) or a Person (an end user), with the asserted email and the kinds of factor used. Credential material lives in the auth store, never here.

| Field | Type | Req | Notes |
|---|---|---|---|
| `principal` | Ref<Member \| Person> | yes | operator or end user |
| `provider` | string | yes | builtin, or the issuer URL of an external provider |
| `subject` | string | yes | the provider's stable id (OIDC sub) |
| `email` | string | no | the address this login asserts; never a key |
| `email_verified` | bool | yes | default `false` |
| `factors` | enum(magic_link\|password\|passkey\|totp\|sms\|oauth\|saml\|api_key)[] | yes | the kinds of credential used; device and enrolment details live in the auth store; default `[]` |
| `claims` | object | no | mapped provider claims; never tokens; ``; confidential |
| `status` | Status(active\|disabled) | yes | default `map[category:active]` |
| `last_seen_at` | datetime | no | touched at most once an hour; drives the monthly active user count |

## Import run

`pack:System` `urn:postware:system:import_run`, identity: id only

One execution of an importer: which importer, in which mode, with what outcome and per-model counts. Every record it wrote carries its id in source.import_run.

| Field | Type | Req | Notes |
|---|---|---|---|
| `importer` | string | yes | csv, stripe, supabase, ... |
| `mode` | enum(once\|continuous) | yes |  |
| `status` | enum(running\|succeeded\|failed\|partial) | yes |  |
| `dry_run` | bool | yes | default `false` |
| `started_at` | datetime | yes |  |
| `finished_at` | datetime | no |  |
| `counts` | object | yes | per model: {created, updated, skipped, errors}; `` |
| `errors` | object[] | no | `{row?: int, path?: string, code: string, message: string}` |

## Invoice

`pack:Billing` `urn:postware:billing:invoice`, identity: `identifiers` or `direction + counterparty + number`; status categories: `draft`, `open`, `paid`, `void`, `uncollectible`

A statement of money owed for goods or services: receivable when we issued it, payable when we received it (a bill). Lines with amounts and taxes, totals, a status from draft to paid, and the payments applied to it.

| Field | Type | Req | Notes |
|---|---|---|---|
| `number` | string | no | required once status is not draft; unique per workspace when receivable, per counterparty when payable |
| `direction` | enum(receivable\|payable) | yes | a bill is a payable Invoice; default `receivable` |
| `counterparty` | Ref<Organization \| Person> | yes |  |
| `bill_to` | Address | no | the billing address as printed; defaults from the counterparty |
| `status` | Status(draft\|open\|paid\|void\|uncollectible) | yes | default `map[category:draft]` |
| `issued_at` | date | yes |  |
| `due_at` | date | no | due_at or terms is given when amount_due is above zero |
| `terms` | string | no | payment terms as text, e.g. Net 30 |
| `currency` | string | yes | ISO 4217; every Money on the invoice uses it; pattern `^[A-Z]{3}$` |
| `tax_inclusive` | bool | yes | default `false` |
| `lines` | object[] | yes | `{product?: Ref<Product>, price?: Ref<Price>, description: string, quantity: decimal, unit?: string, unit_price: Money, discount?: Money, tax_rate?: Ref<Tax rate>, tax_amount?: Money, amount: Money, period?: Period}` |
| `subtotal` | Money | yes | the sum of lines.amount |
| `discount_total` | Money | no | document-level discount |
| `tax_total` | Money | yes |  |
| `total` | Money | yes |  |
| `amount_paid` | Money | yes | maintained from applied Payments |
| `amount_due` | Money | yes | total minus amount_paid |
| `paid_at` | datetime | no |  |
| `reference` | string | no | the buyer's PO or reference |
| `memo` | text | no | a customer-facing note printed on the invoice |
| `subscription` | Ref<Subscription> | no |  |
| `about` | Ref<any>[] | no | the Deal, the Project |

Events: `invoice.paid` when `status.category` becomes `paid`; `invoice.voided` when `status.category` becomes `void`; `invoice.uncollectible` when `status.category` becomes `uncollectible`.

## Member

`pack:System` `urn:postware:system:member`, identity: `person` or `invitation.email`; status categories: `invited`, `active`, `suspended`

An operator of the workspace: a person on the team, an agent or a service, with roles. Authorization, audit and the owner and assignee fields point at Members.

| Field | Type | Req | Notes |
|---|---|---|---|
| `kind` | enum(person\|agent\|service) | yes |  |
| `display_name` | string | yes |  |
| `person` | Ref<Person> | no | the operator's own Person record |
| `roles` | string[] | yes | owner, admin, member, or a custom role name that policies grant |
| `status` | Status(invited\|active\|suspended) | yes | default `map[category:active]` |
| `invitation` | object | no | set while status is invited; the magic link sent to this email activates the Member; `{email: string, invited_by?: Ref<Member>, expires_at?: datetime}` |

## Message

`pack:Core` `urn:postware:core:message`, identity: `identifiers`

One message on a channel: an email, a chat message, an SMS, a call record, with sender, recipients, body and the records it is about. A Ticket's conversation is its Messages.

| Field | Type | Req | Notes |
|---|---|---|---|
| `channel` | enum(email\|chat\|sms\|phone\|web\|social\|api\|other) | yes |  |
| `direction` | enum(inbound\|outbound\|internal) | yes |  |
| `from` | Participant | yes |  |
| `to` | Participant[] | no |  |
| `cc` | Participant[] | no |  |
| `bcc` | Participant[] | no |  |
| `reply_to` | Participant[] | no |  |
| `subject` | string | no |  |
| `body` | text | yes | plain text or Markdown; may be empty when the message is only attachments |
| `body_html` | text | no |  |
| `sent_at` | datetime | yes |  |
| `thread_key` | string | no | opaque grouping key: a mail thread id, a chat channel and thread, a ticket id |
| `in_reply_to` | Ref<Message> | no |  |
| `attachments` | Ref<File>[] | no |  |
| `delivery` | enum(draft\|queued\|sent\|delivered\|failed) | no | outbound only |
| `about` | Ref<any>[] | no | the Ticket, the Deal |

## Note

`pack:Core` `urn:postware:core:note`, identity: `identifiers`

Free text about one or more records: an internal note, a comment, a meeting summary. A Note about exactly one record is a comment on it.

| Field | Type | Req | Notes |
|---|---|---|---|
| `body` | text | yes | Markdown |
| `author` | Ref<Member \| Person> | yes | a guest's comment is a Note by a Person |
| `about` | Ref<any>[] | yes | one record makes it a comment; several make a CRM note |
| `visibility` | enum(internal\|shared) | no | default `internal` |
| `attachments` | Ref<File>[] | no |  |

## Organization

`pack:Core` `urn:postware:core:organization`, identity: `identifiers`

A company, nonprofit, government body or household: a customer, a vendor, a partner or an account. The relationship to the workspace lives on Deals, Invoices, affiliations and tags, never on the Organization.

| Field | Type | Req | Notes |
|---|---|---|---|
| `name` | string | yes |  |
| `phones` | ContactPoint[] | no |  |
| `urls` | ContactPoint[] | no | website first; social profiles after |
| `addresses` | Address[] | no | kind billing, shipping, mailing, work or other |
| `parent` | Ref<Organization> | no |  |
| `logo` | Ref<File> | no |  |
| `description` | text | no |  |

## Payment

`pack:Billing` `urn:postware:billing:payment`, identity: `identifiers`; status categories: `pending`, `succeeded`, `failed`, `cancelled`

Money that moved against invoices: a customer paying us (receivable), us paying a vendor (payable), or a refund of either.

| Field | Type | Req | Notes |
|---|---|---|---|
| `direction` | enum(receivable\|payable) | yes | default `receivable` |
| `kind` | enum(payment\|refund) | yes | default `payment` |
| `counterparty` | Ref<Organization \| Person> | yes |  |
| `amount` | Money | yes |  |
| `paid_at` | datetime | yes |  |
| `method` | enum(card\|bank_transfer\|direct_debit\|cash\|check\|wallet\|other) | no |  |
| `status` | Status(pending\|succeeded\|failed\|cancelled) | yes | default `map[category:succeeded]` |
| `applied` | object[] | no | `{invoice: Ref<Invoice>, amount: Money}` |
| `refund_of` | Ref<Payment> | no |  |
| `reference` | string | no | check number, bank reference, processor id or remittance text |

Events: `payment.succeeded` when `status.category` becomes `succeeded`; `payment.failed` when `status.category` becomes `failed`.

## Person

`pack:Core` `urn:postware:core:person`, identity: `emails.value` or `identifiers`

A human being: a customer, a contact, an employee, or an end user of the product.

| Field | Type | Req | Notes |
|---|---|---|---|
| `name` | Name | yes |  |
| `emails` | ContactPoint[] | no |  |
| `phones` | ContactPoint[] | no | label mobile, home, fax, work or other |
| `urls` | ContactPoint[] | no | websites and social profiles; the URL identifies the network |
| `addresses` | Address[] | no |  |
| `job_title` | string | no |  |
| `affiliations` | Affiliation[] | no | Organizations this person belongs to, with role, primary flag and period |
| `avatar` | Ref<File> | no |  |
| `birthday` | date | no | confidential |
| `locale` | string | no | BCP 47; the OIDC locale claim |
| `timezone` | string | no | IANA zone; the OIDC zoneinfo claim |
| `description` | text | no |  |

## Pipeline

`pack:CRM` `urn:postware:crm:pipeline`, identity: `name`

An ordered set of stages that Deals move through, each mapped to one of the standard categories open, won or lost. A workspace has one default pipeline.

| Field | Type | Req | Notes |
|---|---|---|---|
| `name` | string | yes |  |
| `default` | bool | no | the pipeline new Deals go to when none is given; default `false` |
| `stages` | object[] | yes | `{key: string, label: string, category: enum(open\|won\|lost), order: int, probability?: decimal, archived?: bool}` |

## Policy

`pack:System` `urn:postware:system:policy`, identity: `name`

A rule: which principals may do which actions on which model, narrowed by a filter in the query grammar. Packs ship defaults, admins edit them, Shares compile into them.

| Field | Type | Req | Notes |
|---|---|---|---|
| `name` | string | yes |  |
| `principal` | object | yes | the class of caller the policy applies to; `{kind: enum(role\|end_user\|share\|public), value?: string}` |
| `applies_to` | string | yes | a model name, or * for every model |
| `actions` | enum(read\|create\|update\|delete)[] | yes |  |
| `where` | object | no | a where object of the query grammar; variables @principal.person, @principal.member, @principal.identity, @principal.affiliated_organizations, @share.id, @now; `` |
| `fields` | string[] | no | field allow-list for read or update |
| `enabled` | bool | yes | default `true` |
| `origin` | enum(pack\|workspace\|share) | yes | who created it; default `workspace` |

## Price

`pack:Billing` `urn:postware:billing:price`, identity: `identifiers` or `product + name`

An amount at which a Product is sold, once or on a recurring interval. Subscription items and Invoice lines point at Prices.

| Field | Type | Req | Notes |
|---|---|---|---|
| `product` | Ref<Product> | yes |  |
| `name` | string | no | a short label: Monthly, Annual, 2 seats |
| `amount` | Money | yes | per unit, per interval; tax per tax_inclusive |
| `interval` | enum(one_time\|day\|week\|month\|year) | yes | default `one_time` |
| `interval_count` | int | no | intervals between charges; 3 with month bills quarterly; default `1` |
| `tax_inclusive` | bool | yes | default `false` |
| `active` | bool | yes | default `true` |

## Product

`pack:Core` `urn:postware:core:product`, identity: `identifiers`

A thing the business sells or buys: a good, a service or a digital item. What it costs lives on a Price in the Billing pack.

| Field | Type | Req | Notes |
|---|---|---|---|
| `name` | string | yes |  |
| `description` | text | no |  |
| `kind` | enum(good\|service\|digital) | no |  |
| `unit` | string | no | default unit of measure for invoice lines: a UN/ECE Rec 20 code (C62, HUR) or a word (seat, hour) |
| `tax_rate` | Ref<Tax rate> | no | the default tax rate for lines of this product |
| `active` | bool | yes | default `true` |

## Project

`pack:Core` `urn:postware:core:project`, identity: `identifiers`; status categories: `planned`, `active`, `paused`, `done`, `cancelled`

A container of work with a lifecycle: planned, active, paused, done or cancelled. Tasks belong to it.

| Field | Type | Req | Notes |
|---|---|---|---|
| `name` | string | yes |  |
| `description` | text | no |  |
| `status` | Status(planned\|active\|paused\|done\|cancelled) | yes | default `map[category:active]` |
| `members` | Ref<Member>[] | no |  |
| `archived_at` | datetime | no | hidden from default views; independent of status |
| `about` | Ref<any>[] | no | the client, the deal |

## Share

`pack:System` `urn:postware:system:share`, identity: id only; status categories: `active`, `revoked`

A grant of read, and optionally comment, access to records, by ids or by filter, to someone outside the workspace: a link, an email, another workspace or the public. Compiles into Policies for a synthetic principal.

| Field | Type | Req | Notes |
|---|---|---|---|
| `scope` | Scope | yes | by ids or by filter |
| `grantee` | Grantee | yes | link, email, workspace or public |
| `permissions` | enum(read\|comment)[] | yes |  |
| `expires_at` | datetime | no |  |
| `status` | Status(active\|revoked) | yes | default `map[category:active]` |

## Subscription

`pack:Billing` `urn:postware:billing:subscription`, identity: `identifiers`; status categories: `pending`, `trialing`, `active`, `past_due`, `paused`, `cancelled`

A recurring agreement to bill (receivable) or be billed (payable) for Prices, period after period. Each period's charge is an Invoice that points back at it.

| Field | Type | Req | Notes |
|---|---|---|---|
| `direction` | enum(receivable\|payable) | yes | receivable = our customer; payable = a vendor we pay; default `receivable` |
| `counterparty` | Ref<Organization \| Person> | yes |  |
| `items` | object[] | yes | `{price: Ref<Price>, quantity: decimal}` |
| `status` | Status(pending\|trialing\|active\|past_due\|paused\|cancelled) | yes |  |
| `current_period` | Period | no | the period being billed now; absent while pending |
| `started_at` | datetime | no |  |
| `trial_end` | datetime | no |  |
| `cancel_at` | datetime | no | scheduled end; when set the subscription does not renew |
| `ended_at` | datetime | no |  |
| `reference` | string | no | the customer's PO or reference, copied onto generated invoices |

Events: `subscription.cancelled` when `status.category` becomes `cancelled`; `subscription.activated` when `status.category` becomes `active`; `subscription.past_due` when `status.category` becomes `past_due`.

## Tag

`pack:System` `urn:postware:system:tag`, identity: `namespace + slug`

A label that works the same on every record: a namespaced slug with a display name, a colour and a description. The envelope's tags[] holds slugs that resolve to Tag records.

| Field | Type | Req | Notes |
|---|---|---|---|
| `name` | string | yes | the display form; may carry case and spaces |
| `slug` | string | yes | lowercase segments joined by /; pattern `^[a-z0-9][a-z0-9_-]{0,63}(?:/[a-z0-9][a-z0-9_-]{0,63})*$` |
| `namespace` | string | no | none = workspace-local; sys, a pack name and a source name are reserved; pattern `^[a-z][a-z0-9-]{0,31}$` |
| `color` | string | no | #RRGGBB; pattern `^#[0-9a-fA-F]{6}$` |
| `description` | string | no |  |
| `applies_to` | string[] | no | model names this tag is meant for; absent means any |

## Task

`pack:Core` `urn:postware:core:task`, identity: `identifiers`; status categories: `open`, `in_progress`, `done`, `cancelled`

A unit of work with a status, a priority, assignees and a due date. It nests under a parent Task and belongs to one Project.

| Field | Type | Req | Notes |
|---|---|---|---|
| `title` | string | yes |  |
| `description` | text | no |  |
| `status` | Status(open\|in_progress\|done\|cancelled) | yes | default `map[category:open]` |
| `priority` | enum(urgent\|high\|normal\|low) | no |  |
| `assignees` | Ref<Member>[] | no |  |
| `due_on` | date | no |  |
| `due_at` | datetime | no | set only when the source has a time of day |
| `completed_at` | datetime | no |  |
| `parent` | Ref<Task> | no |  |
| `project` | Ref<Project> | no |  |
| `about` | Ref<any>[] | no |  |

Events: `task.completed` when `status.category` becomes `done`.

## Tax rate

`pack:Billing` `urn:postware:billing:tax_rate`, identity: `identifiers` or `name`

A named tax percentage applied to invoice lines (VAT 20%, GST 5%, a state sales tax), referenced by Products and Invoice lines.

| Field | Type | Req | Notes |
|---|---|---|---|
| `name` | string | yes |  |
| `rate` | decimal | yes | percent: 20 means 20% |
| `description` | string | no |  |
| `active` | bool | yes | default `true` |

## Team

`pack:Core` `urn:postware:core:team`, identity: `identifiers` or `name`

A named group of Members that work is assigned to.

| Field | Type | Req | Notes |
|---|---|---|---|
| `name` | string | yes |  |
| `description` | text | no |  |
| `members` | Ref<Member>[] | no |  |

## Ticket

`pack:Support` `urn:postware:support:ticket`, identity: `identifiers`; status categories: `new`, `open`, `pending`, `on_hold`, `solved`, `closed`

A request for help from a Person, owned by the team until it is solved. The conversation is Messages about it; internal notes are Notes about it.

| Field | Type | Req | Notes |
|---|---|---|---|
| `subject` | string | yes |  |
| `description` | text | no | the request as written; importers copy the first inbound message when the source has no description |
| `requester` | Ref<Person> | yes | often the product's own end user |
| `organization` | Ref<Organization> | no |  |
| `assignee` | Ref<Member> | no |  |
| `team` | Ref<Team> | no |  |
| `status` | Status(new\|open\|pending\|on_hold\|solved\|closed) | yes | default `map[category:new]` |
| `priority` | enum(urgent\|high\|normal\|low) | no |  |
| `channel` | enum(email\|chat\|sms\|phone\|web\|social\|api\|other) | no |  |
| `due_at` | datetime | no |  |
| `resolved_at` | datetime | no | first time status became solved or closed |
| `about` | Ref<any>[] | no |  |

Events: `ticket.solved` when `status.category` becomes `solved`; `ticket.closed` when `status.category` becomes `closed`.

## Workspace

`pack:System` `urn:postware:system:workspace`, identity: `slug`; status categories: `active`, `paused`, `suspended`, `deleted`

The tenant: one company or one person, holding exactly one of these records, its first. Holds the installed packs and the members, identities, policies, shares, tags and records.

| Field | Type | Req | Notes |
|---|---|---|---|
| `slug` | string | yes | URL-safe, unique per server or platform; pattern `^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$` |
| `name` | string | yes |  |
| `kind` | enum(business\|personal\|platform) | no | default `business` |
| `status` | Status(active\|paused\|suspended\|deleted) | yes | default `map[category:active]` |
| `avatar` | Ref<File> | no |  |
| `packs` | string[] | yes | installed packs; default `[]` |
| `auth` | object | no | sign-in settings; `{allowed_email_domains?: string[], allowed_redirect_uris?: string[], allowed_origins?: string[], magic_link_from_name?: string, signup?: enum(open\|invite_only), issuers?: {issuer: string, audience: string, jwks_uri?: string, claims?: {subject?: string, email?: string, email_verified?: string, name?: string, roles?: string}, principal?: {kind: enum(end_user\|member), member_role_claim_values?: , auto_join?: bool}}}` |

## Contributed extensions

Optional, typed fields that packs add to a model without changing the model itself. They live under the record's `ext` field and are addressed as `ext.<namespace>.<name>`, for example `ext.crm.lifecycle_stage`, and you filter on them like any other field. Each row names the model it applies to. A write that uses an extension nobody declared is refused; declare your own for a workspace with `POST /v1/schema/extensions`.

### Deal

| Extension | Type | Notes |
|---|---|---|
| `ext.crm.deal_source` | string | Where this deal came from: the channel, campaign or referral that produced the opportunity. Named deal_source because the envelope's source object holds import provenance. |
| `ext.crm.line_items` | object | The products on the deal before a quote or invoice exists: an object { lines: [ { product (a Product id), description, quantity (decimal string), unit_price { amount, currency } } ] }. Quantities and prices belong on the Invoice once one exists. |
| `ext.crm.lost_reason` | string | Why the deal was lost, in the team's own words or vocabulary. |
| `ext.crm.won_reason` | string | Why the deal was won, in the team's own words or vocabulary. |

### Event

| Extension | Type | Notes |
|---|---|---|
| `ext.calendar.exdates` | string | RFC 5545 EXDATE: the occurrences of the series that are removed, as a comma-separated list of date-times. |
| `ext.calendar.rdates` | string | RFC 5545 RDATE: extra occurrences added to the series, as a comma-separated list of date-times. |
| `ext.calendar.recurrence_id` | datetime | RFC 5545 RECURRENCE-ID on a modified occurrence: the original start of the instance this record overrides; the series master is found by the shared ical:uid identifier. |
| `ext.calendar.reminders` | object | Alarms before the event: { overrides: [ { method (popup, email), minutes_before (int) } ] }; absent means the calendar's default. |
| `ext.calendar.transparency` | enum(opaque\|transparent) | RFC 5545 TRANSP: whether the event blocks time (opaque) or not (transparent). |
| `ext.calendar.visibility` | enum(public\|private\|confidential) | RFC 5545 CLASS: who may see the details. |

### Invoice

| Extension | Type | Notes |
|---|---|---|
| `ext.billing.exchange_rate` | decimal | The rate from the invoice currency to the workspace's reporting currency at issue, as a decimal string. |

### Message

| Extension | Type | Notes |
|---|---|---|
| `ext.messaging.received_at` | datetime | When the receiving system accepted the message (the Received trace, Gmail internalDate, Graph receivedDateTime); sent_at orders the thread, this records delivery. |
| `ext.messaging.references` | string | The RFC 5322 References header as written: the Message-IDs of the thread's ancestors, space-separated, for rebuilding threads of imported mail. |

### Organization

| Extension | Type | Notes |
|---|---|---|
| `ext.billing.legal_name` | string | The registered legal name, when it differs from name; printed on invoices and used by the e-invoicing profile. |
| `ext.crm.annual_revenue` | Money | Annual revenue as Money { amount, currency }, as reported or estimated. |
| `ext.crm.employees` | int | Number of employees; a band from the source (1-10, 11-50) is kept in source.payload. |
| `ext.crm.industry` | string | The organization's industry in the workspace's own vocabulary; every CRM ships a different picklist. |
| `ext.crm.lifecycle_stage` | enum(subscriber\|lead\|marketing_qualified_lead\|sales_qualified_lead\|opportunity\|customer\|evangelist\|other) | Where this organization stands in the marketing and sales lifecycle, from subscriber to evangelist. |

### Person

| Extension | Type | Notes |
|---|---|---|
| `ext.crm.lifecycle_stage` | enum(subscriber\|lead\|marketing_qualified_lead\|sales_qualified_lead\|opportunity\|customer\|evangelist\|other) | Where this person stands in the marketing and sales lifecycle, from subscriber to evangelist (the HubSpot stages, snake_case). A lead is a Person with lifecycle_stage lead; there is no Lead model. |
| `ext.crm.source` | string | Where this person came from: the channel or campaign that produced the contact (organic search, referral, event, paid social). |

### Price

| Extension | Type | Notes |
|---|---|---|
| `ext.billing.tiers` | object | Tiered or volume pricing: { scheme (graduated \| volume), tiers: [ { up_to (decimal string or null for the last tier), unit_amount { amount, currency }, flat_amount { amount, currency } } ] }. |
| `ext.billing.trial_days` | int | Free trial length in days granted when a subscription starts on this price. |
| `ext.billing.usage_based` | bool | True when the quantity billed each period comes from metered usage rather than a fixed quantity. |

### Product

| Extension | Type | Notes |
|---|---|---|
| `ext.catalog.image` | string | The id of the File holding the product image. |

### Task

| Extension | Type | Notes |
|---|---|---|
| `ext.work.estimate` | duration | The effort estimate as an ISO 8601 duration; points and other units stay in source.payload. |
| `ext.work.rank` | string | Manual ordering key within a view; lexicographic. |
| `ext.work.recurrence` | Recurrence | An RFC 5545 RRULE for a task that recurs on completion; natural-language rules are translated or kept in source.payload. |
| `ext.work.start` | datetime | When work is planned to start. |

### Tax rate

| Extension | Type | Notes |
|---|---|---|
| `ext.billing.jurisdiction` | object | Where the rate applies: { country (ISO 3166-1 alpha-2), region }. |
| `ext.billing.tax_kind` | enum(vat\|gst\|sales_tax\|other) | The kind of tax the rate is: VAT, GST, a sales tax, or another. |

### Team

| Extension | Type | Notes |
|---|---|---|
| `ext.org.kind` | enum(team\|department\|cost_center\|business_unit\|group) | What kind of group this is in the organization chart. |
| `ext.org.lead` | string | The id of the Member who leads the team; the envelope's owner is the accountable operator of the record itself. |
| `ext.org.parent` | string | The id of the parent Team in the hierarchy. |

### Ticket

| Extension | Type | Notes |
|---|---|---|
| `ext.support.cc` | object | People copied on the whole ticket rather than on single messages: { participants: [ Participant ] }. |
| `ext.support.first_responded_at` | datetime | When the team first replied to the requester; the start of SLA reporting. |
| `ext.support.kind` | string | The ticket type in the source's vocabulary: question, incident, problem, task, feedback, or a workspace's own. |
| `ext.support.parent` | string | The id of the parent Ticket (a problem this incident belongs to, a tracker, a follow-up source). |
| `ext.support.satisfaction` | object | The requester's rating after resolution: { rating (int, 1 to 5), comment }. |
