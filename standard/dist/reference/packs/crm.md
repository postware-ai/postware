# CRM

Sales pipelines and the deals moving through them.

Packs are versioned with the standard, currently 0.1.0. Each model below has its own version.

## Models

| Model | Version | Description |
|---|---|---|
| [Deal](../models/deal) | v1 | A potential sale to an Organization or a Person, tracked through a Pipeline, with an amount, a probability and an expected close. |
| [Pipeline](../models/pipeline) | v1 | An ordered set of stages that Deals move through, each mapped to one of the standard categories open, won or lost. |

## Extensions

Fields this pack adds to other models.

### [Deal](../models/deal)

| Extension | Type | Notes |
|---|---|---|
| `ext.crm.deal_source` | string | Where this deal came from: the channel, campaign or referral that produced the opportunity. Named deal_source because the envelope's source object holds import provenance. |
| `ext.crm.line_items` | object | The products on the deal before a quote or invoice exists: an object { lines: [ { product (a Product id), description, quantity (decimal string), unit_price { amount, currency } } ] }. Quantities and prices belong on the Invoice once one exists. |
| `ext.crm.lost_reason` | string | Why the deal was lost, in the team's own words or vocabulary. |
| `ext.crm.won_reason` | string | Why the deal was won, in the team's own words or vocabulary. |

### [Organization](../models/organization)

| Extension | Type | Notes |
|---|---|---|
| `ext.crm.annual_revenue` | Money | Annual revenue as Money { amount, currency }, as reported or estimated. |
| `ext.crm.employees` | int | Number of employees; a band from the source (1-10, 11-50) is kept in source.payload. |
| `ext.crm.industry` | string | The organization's industry in the workspace's own vocabulary; every CRM ships a different picklist. |
| `ext.crm.lifecycle_stage` | enum(subscriber\|lead\|marketing_qualified_lead\|sales_qualified_lead\|opportunity\|customer\|evangelist\|other) | Where this organization stands in the marketing and sales lifecycle, from subscriber to evangelist. |

### [Person](../models/person)

| Extension | Type | Notes |
|---|---|---|
| `ext.crm.lifecycle_stage` | enum(subscriber\|lead\|marketing_qualified_lead\|sales_qualified_lead\|opportunity\|customer\|evangelist\|other) | Where this person stands in the marketing and sales lifecycle, from subscriber to evangelist (the HubSpot stages, snake_case). A lead is a Person with lifecycle_stage lead; there is no Lead model. |
| `ext.crm.source` | string | Where this person came from: the channel or campaign that produced the contact (organic search, referral, event, paid social). |
