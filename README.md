<p align="center">
  <img src="docs/readme-banner.png" alt="Postware: the system of record for agents." width="100%">
</p>

<p align="center">
  <a href="https://postware.ai">Website</a> · <a href="https://postware.ai/docs">Docs</a> · <a href="https://postware.ai/docs/models">Models</a> · <a href="https://postware.ai/pricing">Pricing</a>
</p>

# Postware

Give your agents open data models and skills for everything your company needs, from customers and deals to invoices and support tickets. Hosted cheaply at [postware.ai](https://postware.ai), so you can finally ditch your SaaS stack.

**The Postware standards live in this repo, and they are open source.** The data models, specs and agent skill are all here under the Apache 2.0 license, so anyone can read them, build on them or propose a change.

## Get started

Paste this into any AI assistant. It connects itself if it can, or walks you through it.

```text
Set up Postware here. If you can, create a Postware cloud workspace, connect it and install its skill, asking me only for my email. If you can't, walk me through it. Follow https://postware.ai/docs/start.md
```

Free tier included. No card needed.

## What's in this repo

| Path | What it holds |
|---|---|
| [`standard/`](standard/README.md) | The models, value types, extensions, default policies and conformance tests, plus compiled JSON Schema, OpenAPI and MCP tool definitions |
| [`docs/spec/`](docs/spec) | The specs for the [schema](docs/spec/01-schema.md), the [query grammar](docs/spec/02-query.md), and [policies and shares](docs/spec/04-policy-share.md) |
| [`skill/`](skill/SKILL.md) | The skill that teaches an agent to run a company on a workspace |
| [`sdk/typescript/`](sdk/typescript/README.md) | The source of `@postware/sdk`, a typed TypeScript client (not on npm yet) |
| [`rfcs/`](rfcs/README.md) | Proposed changes to the standards |

## 27 models, ready to use

Every workspace includes all of them. Each one is versioned and written for an agent to read and use correctly.

| Pack | Models |
|---|---|
| System | workspace, member, identity, policy, share, tag, import_run |
| Core | person, organization, team, project, task, event, note, message, file, product |
| CRM | pipeline, deal |
| Billing | price, subscription, invoice, payment, tax_rate |
| Support | ticket |
| Content | collection, document |

Each model is one YAML file in [`standard/models/`](standard/models), with a stable URN, typed fields, identity rules that decide what counts as a duplicate, and status categories. Major changes get a new URN version and minor changes only add. [`standard/README.md`](standard/README.md) explains the layout, the versioning rules and how to propose a change.

## Contributing

The standards are open, so changes are welcome. See [`CONTRIBUTING.md`](CONTRIBUTING.md). Changes that are not additive go through an RFC in [`rfcs/`](rfcs/README.md).

## License

Apache License, Version 2.0: [`LICENSE`](LICENSE).
