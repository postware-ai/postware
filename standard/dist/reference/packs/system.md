# System

The accounts, permissions, sharing and labels every workspace has. Included in every workspace.

Packs are versioned with the standard, currently 0.1.0. Each model below has its own version.

## Models

| Model | Version | Description |
|---|---|---|
| [Identity](../models/identity) | v1 | How a principal authenticates: a provider's stable subject bound to a Member (an operator) or a Person (an end user), with the asserted email and the kinds of factor used. |
| [Import run](../models/import_run) | v1 | One execution of an importer: which importer, in which mode, with what outcome and per-model counts. |
| [Member](../models/member) | v1 | An operator of the workspace: a person on the team, an agent or a service, with roles. |
| [Policy](../models/policy) | v1 | A rule: which principals may do which actions on which model, narrowed by a filter in the query grammar. |
| [Share](../models/share) | v1 | A grant of read, and optionally comment, access to records, by ids or by filter, to someone outside the workspace: a link, an email, another workspace or the public. |
| [Tag](../models/tag) | v1 | A label that works the same on every record: a namespaced slug with a display name, a colour and a description. |
| [Workspace](../models/workspace) | v1 | The tenant: one company or one person, holding exactly one of these records, its first. |
