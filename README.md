<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/banner-dark.png">
    <img src="docs/banner-light.png" alt="Postware: the system of record for agents." width="100%">
  </picture>
</p>

# Postware

An open standard of business data models for companies run by agents.

One workspace holds a company's customers, deals, invoices, subscriptions, tickets, tasks, content and files as standard records. Every agent and every product reads and writes the same models, so the company's data stays in one place and in one shape. Postware runs it for you at [postware.ai](https://postware.ai).

## What is here

| Path | What it holds |
|---|---|
| [`standard/`](standard/README.md) | the standard: model definitions, value types, extensions, default policies, importer manifests, conformance fixtures and test vectors, and the compiled artifacts in `dist/` |
| [`docs/spec/`](docs/spec) | the specs: the [schema](docs/spec/01-schema.md), the [query grammar](docs/spec/02-query.md), and [policies and shares](docs/spec/04-policy-share.md) |
| [`sdk/typescript/`](sdk/typescript/README.md) | `@postware/sdk`, the typed TypeScript client |
| [`skill/`](skill/SKILL.md) | the skill that teaches a coding agent to start a company on a workspace |
| [`rfcs/`](rfcs/README.md) | proposed changes to the standard |

## The models

Twenty-seven models in six groups.

| Group | Models |
|---|---|
| System | workspace, member, identity, policy, share, tag, import_run |
| Core | person, organization, team, project, task, event, note, message, file, product |
| CRM | pipeline, deal |
| Billing | price, subscription, invoice, payment, tax_rate |
| Support | ticket |
| Content | collection, document |

Each model is one YAML file in `standard/models/`, with a stable URN, typed fields, identity rules that decide what counts as a duplicate, status categories, and prose written for the agents that use it. The compiled artifacts in `standard/dist/` include JSON Schema, OpenAPI, MCP tool definitions and a model reference.

Every model, field and extension has a URN. Majors are new URN versions and minors are additive. [`standard/README.md`](standard/README.md) explains the layout, the URN scheme, the versioning rules and how to propose a change.

## Use it

Start a workspace at [postware.ai](https://postware.ai), then give your coding agent the [skill](skill/SKILL.md), or use the SDK directly:

```ts
import { Postware } from "@postware/sdk";

const a = new Postware({ baseUrl: process.env.POSTWARE_URL!, workspace: process.env.POSTWARE_WORKSPACE!, token: process.env.POSTWARE_API_KEY });

const page = await a.person.query({ where: { "emails.value": "ada@example.com" }, limit: 10 });
```

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md). Changes to the standard that are not additive go through an RFC in `rfcs/`.

## Licence

Apache License, Version 2.0: [`LICENSE`](LICENSE).
