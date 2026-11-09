# Billing

Prices, subscriptions, invoices, payments and tax rates.

Packs are versioned with the standard, currently 0.1.0. Each model below has its own version.

## Models

| Model | Version | Description |
|---|---|---|
| [Invoice](../models/invoice) | v1 | A statement of money owed for goods or services: receivable when we issued it, payable when we received it (a bill). |
| [Payment](../models/payment) | v1 | Money that moved against invoices: a customer paying us (receivable), us paying a vendor (payable), or a refund of either. |
| [Price](../models/price) | v1 | An amount at which a Product is sold, once or on a recurring interval. |
| [Subscription](../models/subscription) | v1 | A recurring agreement to bill (receivable) or be billed (payable) for Prices, period after period. |
| [Tax rate](../models/tax_rate) | v1 | A named tax percentage applied to invoice lines (VAT 20%, GST 5%, a state sales tax), referenced by Products and Invoice lines. |

## Extensions

Fields this pack adds to other models.

### [Invoice](../models/invoice)

| Extension | Type | Notes |
|---|---|---|
| `ext.billing.exchange_rate` | decimal | The rate from the invoice currency to the workspace's reporting currency at issue, as a decimal string. |

### [Organization](../models/organization)

| Extension | Type | Notes |
|---|---|---|
| `ext.billing.legal_name` | string | The registered legal name, when it differs from name; printed on invoices and used by the e-invoicing profile. |

### [Price](../models/price)

| Extension | Type | Notes |
|---|---|---|
| `ext.billing.tiers` | object | Tiered or volume pricing: { scheme (graduated \| volume), tiers: [ { up_to (decimal string or null for the last tier), unit_amount { amount, currency }, flat_amount { amount, currency } } ] }. |
| `ext.billing.trial_days` | int | Free trial length in days granted when a subscription starts on this price. |
| `ext.billing.usage_based` | bool | True when the quantity billed each period comes from metered usage rather than a fixed quantity. |

### [Tax rate](../models/tax_rate)

| Extension | Type | Notes |
|---|---|---|
| `ext.billing.jurisdiction` | object | Where the rate applies: { country (ISO 3166-1 alpha-2), region }. |
| `ext.billing.tax_kind` | enum(vat\|gst\|sales_tax\|other) | The kind of tax the rate is: VAT, GST, a sales tax, or another. |
