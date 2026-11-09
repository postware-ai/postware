# HTTP API

Base: `{API_BASE_URL}/w/{ws}`. JSON everywhere; `Authorization: Bearer <token>` under `/v1`. Errors are `{ "error": { "code", "message", "details" } }`.


## Identity

| Method | Path | Does |
|---|---|---|
| `GET` | `/v1/identity` | List Identity records |
| `POST` | `/v1/identity` | Create an Identity |
| `POST` | `/v1/identity/query` | Query Identity records |
| `POST` | `/v1/identity/upsert` | Create or update an Identity by identity rules |
| `GET` | `/v1/identity/{id}` | Get an Identity |
| `PATCH` | `/v1/identity/{id}` | Update an Identity |
| `DELETE` | `/v1/identity/{id}` | Delete an Identity (soft) |
| `GET` | `/v1/identity/{id}/history` | Revisions of an Identity from the audit log |

## Import run

| Method | Path | Does |
|---|---|---|
| `GET` | `/v1/import_run` | List Import run records |
| `POST` | `/v1/import_run` | Create an Import run |
| `POST` | `/v1/import_run/query` | Query Import run records |
| `POST` | `/v1/import_run/upsert` | Create or update an Import run by identity rules |
| `GET` | `/v1/import_run/{id}` | Get an Import run |
| `PATCH` | `/v1/import_run/{id}` | Update an Import run |
| `DELETE` | `/v1/import_run/{id}` | Delete an Import run (soft) |
| `GET` | `/v1/import_run/{id}/history` | Revisions of an Import run from the audit log |

## Member

| Method | Path | Does |
|---|---|---|
| `GET` | `/v1/member` | List Member records |
| `POST` | `/v1/member` | Create a Member |
| `POST` | `/v1/member/query` | Query Member records |
| `POST` | `/v1/member/upsert` | Create or update a Member by identity rules |
| `GET` | `/v1/member/{id}` | Get a Member |
| `PATCH` | `/v1/member/{id}` | Update a Member |
| `DELETE` | `/v1/member/{id}` | Delete a Member (soft) |
| `GET` | `/v1/member/{id}/history` | Revisions of a Member from the audit log |

## Policy

| Method | Path | Does |
|---|---|---|
| `GET` | `/v1/policy` | List Policy records |
| `POST` | `/v1/policy` | Create a Policy |
| `POST` | `/v1/policy/query` | Query Policy records |
| `POST` | `/v1/policy/upsert` | Create or update a Policy by identity rules |
| `GET` | `/v1/policy/{id}` | Get a Policy |
| `PATCH` | `/v1/policy/{id}` | Update a Policy |
| `DELETE` | `/v1/policy/{id}` | Delete a Policy (soft) |
| `GET` | `/v1/policy/{id}/history` | Revisions of a Policy from the audit log |

## Share

| Method | Path | Does |
|---|---|---|
| `GET` | `/v1/share` | List Share records |
| `POST` | `/v1/share` | Create a Share |
| `POST` | `/v1/share/query` | Query Share records |
| `POST` | `/v1/share/upsert` | Create or update a Share by identity rules |
| `GET` | `/v1/share/{id}` | Get a Share |
| `PATCH` | `/v1/share/{id}` | Update a Share |
| `DELETE` | `/v1/share/{id}` | Delete a Share (soft) |
| `GET` | `/v1/share/{id}/history` | Revisions of a Share from the audit log |

## Tag

| Method | Path | Does |
|---|---|---|
| `GET` | `/v1/tag` | List Tag records |
| `POST` | `/v1/tag` | Create a Tag |
| `POST` | `/v1/tag/query` | Query Tag records |
| `POST` | `/v1/tag/upsert` | Create or update a Tag by identity rules |
| `GET` | `/v1/tag/{id}` | Get a Tag |
| `PATCH` | `/v1/tag/{id}` | Update a Tag |
| `DELETE` | `/v1/tag/{id}` | Delete a Tag (soft) |
| `GET` | `/v1/tag/{id}/history` | Revisions of a Tag from the audit log |

## Workspace

| Method | Path | Does |
|---|---|---|
| `GET` | `/v1/workspace` | List Workspace records |
| `POST` | `/v1/workspace` | Create a Workspace |
| `POST` | `/v1/workspace/query` | Query Workspace records |
| `POST` | `/v1/workspace/upsert` | Create or update a Workspace by identity rules |
| `GET` | `/v1/workspace/{id}` | Get a Workspace |
| `PATCH` | `/v1/workspace/{id}` | Update a Workspace |
| `DELETE` | `/v1/workspace/{id}` | Delete a Workspace (soft) |
| `GET` | `/v1/workspace/{id}/history` | Revisions of a Workspace from the audit log |

## Event

| Method | Path | Does |
|---|---|---|
| `GET` | `/v1/event` | List Event records |
| `POST` | `/v1/event` | Create an Event |
| `POST` | `/v1/event/query` | Query Event records |
| `POST` | `/v1/event/upsert` | Create or update an Event by identity rules |
| `GET` | `/v1/event/{id}` | Get an Event |
| `PATCH` | `/v1/event/{id}` | Update an Event |
| `DELETE` | `/v1/event/{id}` | Delete an Event (soft) |
| `GET` | `/v1/event/{id}/history` | Revisions of an Event from the audit log |

## File

| Method | Path | Does |
|---|---|---|
| `GET` | `/v1/file` | List File records |
| `POST` | `/v1/file` | Create a File |
| `POST` | `/v1/file/query` | Query File records |
| `POST` | `/v1/file/upsert` | Create or update a File by identity rules |
| `GET` | `/v1/file/{id}` | Get a File |
| `PATCH` | `/v1/file/{id}` | Update a File |
| `DELETE` | `/v1/file/{id}` | Delete a File (soft) |
| `GET` | `/v1/file/{id}/history` | Revisions of a File from the audit log |

## Message

| Method | Path | Does |
|---|---|---|
| `GET` | `/v1/message` | List Message records |
| `POST` | `/v1/message` | Create a Message |
| `POST` | `/v1/message/query` | Query Message records |
| `POST` | `/v1/message/upsert` | Create or update a Message by identity rules |
| `GET` | `/v1/message/{id}` | Get a Message |
| `PATCH` | `/v1/message/{id}` | Update a Message |
| `DELETE` | `/v1/message/{id}` | Delete a Message (soft) |
| `GET` | `/v1/message/{id}/history` | Revisions of a Message from the audit log |

## Note

| Method | Path | Does |
|---|---|---|
| `GET` | `/v1/note` | List Note records |
| `POST` | `/v1/note` | Create a Note |
| `POST` | `/v1/note/query` | Query Note records |
| `POST` | `/v1/note/upsert` | Create or update a Note by identity rules |
| `GET` | `/v1/note/{id}` | Get a Note |
| `PATCH` | `/v1/note/{id}` | Update a Note |
| `DELETE` | `/v1/note/{id}` | Delete a Note (soft) |
| `GET` | `/v1/note/{id}/history` | Revisions of a Note from the audit log |

## Organization

| Method | Path | Does |
|---|---|---|
| `GET` | `/v1/organization` | List Organization records |
| `POST` | `/v1/organization` | Create an Organization |
| `POST` | `/v1/organization/query` | Query Organization records |
| `POST` | `/v1/organization/upsert` | Create or update an Organization by identity rules |
| `GET` | `/v1/organization/{id}` | Get an Organization |
| `PATCH` | `/v1/organization/{id}` | Update an Organization |
| `DELETE` | `/v1/organization/{id}` | Delete an Organization (soft) |
| `GET` | `/v1/organization/{id}/history` | Revisions of an Organization from the audit log |

## Person

| Method | Path | Does |
|---|---|---|
| `GET` | `/v1/person` | List Person records |
| `POST` | `/v1/person` | Create a Person |
| `POST` | `/v1/person/query` | Query Person records |
| `POST` | `/v1/person/upsert` | Create or update a Person by identity rules |
| `GET` | `/v1/person/{id}` | Get a Person |
| `PATCH` | `/v1/person/{id}` | Update a Person |
| `DELETE` | `/v1/person/{id}` | Delete a Person (soft) |
| `GET` | `/v1/person/{id}/history` | Revisions of a Person from the audit log |

## Product

| Method | Path | Does |
|---|---|---|
| `GET` | `/v1/product` | List Product records |
| `POST` | `/v1/product` | Create a Product |
| `POST` | `/v1/product/query` | Query Product records |
| `POST` | `/v1/product/upsert` | Create or update a Product by identity rules |
| `GET` | `/v1/product/{id}` | Get a Product |
| `PATCH` | `/v1/product/{id}` | Update a Product |
| `DELETE` | `/v1/product/{id}` | Delete a Product (soft) |
| `GET` | `/v1/product/{id}/history` | Revisions of a Product from the audit log |

## Project

| Method | Path | Does |
|---|---|---|
| `GET` | `/v1/project` | List Project records |
| `POST` | `/v1/project` | Create a Project |
| `POST` | `/v1/project/query` | Query Project records |
| `POST` | `/v1/project/upsert` | Create or update a Project by identity rules |
| `GET` | `/v1/project/{id}` | Get a Project |
| `PATCH` | `/v1/project/{id}` | Update a Project |
| `DELETE` | `/v1/project/{id}` | Delete a Project (soft) |
| `GET` | `/v1/project/{id}/history` | Revisions of a Project from the audit log |

## Task

| Method | Path | Does |
|---|---|---|
| `GET` | `/v1/task` | List Task records |
| `POST` | `/v1/task` | Create a Task |
| `POST` | `/v1/task/query` | Query Task records |
| `POST` | `/v1/task/upsert` | Create or update a Task by identity rules |
| `GET` | `/v1/task/{id}` | Get a Task |
| `PATCH` | `/v1/task/{id}` | Update a Task |
| `DELETE` | `/v1/task/{id}` | Delete a Task (soft) |
| `GET` | `/v1/task/{id}/history` | Revisions of a Task from the audit log |

## Team

| Method | Path | Does |
|---|---|---|
| `GET` | `/v1/team` | List Team records |
| `POST` | `/v1/team` | Create a Team |
| `POST` | `/v1/team/query` | Query Team records |
| `POST` | `/v1/team/upsert` | Create or update a Team by identity rules |
| `GET` | `/v1/team/{id}` | Get a Team |
| `PATCH` | `/v1/team/{id}` | Update a Team |
| `DELETE` | `/v1/team/{id}` | Delete a Team (soft) |
| `GET` | `/v1/team/{id}/history` | Revisions of a Team from the audit log |

## Deal

| Method | Path | Does |
|---|---|---|
| `GET` | `/v1/deal` | List Deal records |
| `POST` | `/v1/deal` | Create a Deal |
| `POST` | `/v1/deal/query` | Query Deal records |
| `POST` | `/v1/deal/upsert` | Create or update a Deal by identity rules |
| `GET` | `/v1/deal/{id}` | Get a Deal |
| `PATCH` | `/v1/deal/{id}` | Update a Deal |
| `DELETE` | `/v1/deal/{id}` | Delete a Deal (soft) |
| `GET` | `/v1/deal/{id}/history` | Revisions of a Deal from the audit log |

## Pipeline

| Method | Path | Does |
|---|---|---|
| `GET` | `/v1/pipeline` | List Pipeline records |
| `POST` | `/v1/pipeline` | Create a Pipeline |
| `POST` | `/v1/pipeline/query` | Query Pipeline records |
| `POST` | `/v1/pipeline/upsert` | Create or update a Pipeline by identity rules |
| `GET` | `/v1/pipeline/{id}` | Get a Pipeline |
| `PATCH` | `/v1/pipeline/{id}` | Update a Pipeline |
| `DELETE` | `/v1/pipeline/{id}` | Delete a Pipeline (soft) |
| `GET` | `/v1/pipeline/{id}/history` | Revisions of a Pipeline from the audit log |

## Invoice

| Method | Path | Does |
|---|---|---|
| `GET` | `/v1/invoice` | List Invoice records |
| `POST` | `/v1/invoice` | Create an Invoice |
| `POST` | `/v1/invoice/query` | Query Invoice records |
| `POST` | `/v1/invoice/upsert` | Create or update an Invoice by identity rules |
| `GET` | `/v1/invoice/{id}` | Get an Invoice |
| `PATCH` | `/v1/invoice/{id}` | Update an Invoice |
| `DELETE` | `/v1/invoice/{id}` | Delete an Invoice (soft) |
| `GET` | `/v1/invoice/{id}/history` | Revisions of an Invoice from the audit log |

## Payment

| Method | Path | Does |
|---|---|---|
| `GET` | `/v1/payment` | List Payment records |
| `POST` | `/v1/payment` | Create a Payment |
| `POST` | `/v1/payment/query` | Query Payment records |
| `POST` | `/v1/payment/upsert` | Create or update a Payment by identity rules |
| `GET` | `/v1/payment/{id}` | Get a Payment |
| `PATCH` | `/v1/payment/{id}` | Update a Payment |
| `DELETE` | `/v1/payment/{id}` | Delete a Payment (soft) |
| `GET` | `/v1/payment/{id}/history` | Revisions of a Payment from the audit log |

## Price

| Method | Path | Does |
|---|---|---|
| `GET` | `/v1/price` | List Price records |
| `POST` | `/v1/price` | Create a Price |
| `POST` | `/v1/price/query` | Query Price records |
| `POST` | `/v1/price/upsert` | Create or update a Price by identity rules |
| `GET` | `/v1/price/{id}` | Get a Price |
| `PATCH` | `/v1/price/{id}` | Update a Price |
| `DELETE` | `/v1/price/{id}` | Delete a Price (soft) |
| `GET` | `/v1/price/{id}/history` | Revisions of a Price from the audit log |

## Subscription

| Method | Path | Does |
|---|---|---|
| `GET` | `/v1/subscription` | List Subscription records |
| `POST` | `/v1/subscription` | Create a Subscription |
| `POST` | `/v1/subscription/query` | Query Subscription records |
| `POST` | `/v1/subscription/upsert` | Create or update a Subscription by identity rules |
| `GET` | `/v1/subscription/{id}` | Get a Subscription |
| `PATCH` | `/v1/subscription/{id}` | Update a Subscription |
| `DELETE` | `/v1/subscription/{id}` | Delete a Subscription (soft) |
| `GET` | `/v1/subscription/{id}/history` | Revisions of a Subscription from the audit log |

## Tax rate

| Method | Path | Does |
|---|---|---|
| `GET` | `/v1/tax_rate` | List Tax rate records |
| `POST` | `/v1/tax_rate` | Create a Tax rate |
| `POST` | `/v1/tax_rate/query` | Query Tax rate records |
| `POST` | `/v1/tax_rate/upsert` | Create or update a Tax rate by identity rules |
| `GET` | `/v1/tax_rate/{id}` | Get a Tax rate |
| `PATCH` | `/v1/tax_rate/{id}` | Update a Tax rate |
| `DELETE` | `/v1/tax_rate/{id}` | Delete a Tax rate (soft) |
| `GET` | `/v1/tax_rate/{id}/history` | Revisions of a Tax rate from the audit log |

## Ticket

| Method | Path | Does |
|---|---|---|
| `GET` | `/v1/ticket` | List Ticket records |
| `POST` | `/v1/ticket` | Create a Ticket |
| `POST` | `/v1/ticket/query` | Query Ticket records |
| `POST` | `/v1/ticket/upsert` | Create or update a Ticket by identity rules |
| `GET` | `/v1/ticket/{id}` | Get a Ticket |
| `PATCH` | `/v1/ticket/{id}` | Update a Ticket |
| `DELETE` | `/v1/ticket/{id}` | Delete a Ticket (soft) |
| `GET` | `/v1/ticket/{id}/history` | Revisions of a Ticket from the audit log |

## Collection

| Method | Path | Does |
|---|---|---|
| `GET` | `/v1/collection` | List Collection records |
| `POST` | `/v1/collection` | Create a Collection |
| `POST` | `/v1/collection/query` | Query Collection records |
| `POST` | `/v1/collection/upsert` | Create or update a Collection by identity rules |
| `GET` | `/v1/collection/{id}` | Get a Collection |
| `PATCH` | `/v1/collection/{id}` | Update a Collection |
| `DELETE` | `/v1/collection/{id}` | Delete a Collection (soft) |
| `GET` | `/v1/collection/{id}/history` | Revisions of a Collection from the audit log |

## Document

| Method | Path | Does |
|---|---|---|
| `GET` | `/v1/document` | List Document records |
| `POST` | `/v1/document` | Create a Document |
| `POST` | `/v1/document/query` | Query Document records |
| `POST` | `/v1/document/upsert` | Create or update a Document by identity rules |
| `GET` | `/v1/document/{id}` | Get a Document |
| `PATCH` | `/v1/document/{id}` | Update a Document |
| `DELETE` | `/v1/document/{id}` | Delete a Document (soft) |
| `GET` | `/v1/document/{id}/history` | Revisions of a Document from the audit log |

## Records

| Method | Path | Does |
|---|---|---|
| `POST` | `/v1/batch` | Run up to 500 operations |
| `GET` | `/v1/search` | Full-text search across models |
| `POST` | `/v1/search` | Full-text search across models |

## Schema

| Method | Path | Does |
|---|---|---|
| `GET` | `/v1/schema` | List models |
| `GET` | `/v1/schema/extensions` | Declared extensions |
| `POST` | `/v1/schema/extensions` | Declare an extension (admins) |
| `GET` | `/v1/schema/openapi.json` | This document |
| `GET` | `/v1/schema/{model}` | JSON Schema, identity rules, status categories, extensions and an example |

## Imports and exports

| Method | Path | Does |
|---|---|---|
| `POST` | `/v1/exports` | Start an export job (sqlite, csv or jsonl) |
| `GET` | `/v1/exports/{id}` | Export status and, when succeeded, the download URL |
| `GET` | `/v1/exports/{id}/download` | The export file (the job's signed download_url, or bearer auth) |
| `POST` | `/v1/imports` | Run a CSV import |
| `GET` | `/v1/imports/{id}` | An ImportRun |

## Files

| Method | Path | Does |
|---|---|---|
| `POST` | `/v1/file/upload-url` | Create a pending File and get where to PUT its bytes |
| `POST` | `/v1/file/{id}/complete` | Verify size and checksum after the upload; the same bytes dedupe to one File |
| `PUT` | `/v1/file/{id}/content` | Upload the bytes of a pending File (local storage; a presigned store answers 405) |
| `GET` | `/v1/file/{id}/download` | The bytes (the signed link from download-url, or bearer auth) |
| `GET` | `/v1/file/{id}/download-url` | A download link valid 15 minutes, usable from a plain browser |

## Events

| Method | Path | Does |
|---|---|---|
| `GET` | `/v1/events` | Server-sent events with replay from ?after=<seq> |
| `GET` | `/v1/webhooks` | List webhooks (admins); secrets are not returned |
| `POST` | `/v1/webhooks` | Register a webhook (admins); the secret is returned once |
| `DELETE` | `/v1/webhooks/{id}` | Remove a webhook (admins) |

## Auth

| Method | Path | Does |
|---|---|---|
| `GET` | `/v1/me` | The principal, its Member or Person, scopes, plan and limits |

## Operational

| Method | Path | Does |
|---|---|---|
| `GET` | `/v1/audit` | Audit log (admins) |
| `GET` | `/v1/stats` | Counts per model, MAU, bytes, sources |

Auth routes (`/auth/*`, `/oauth/*`, `/.well-known/*`), shares (`/s/{token}/...`) and public reads (`/p/{ws}/...`) are described in the specs 03 and 04.
