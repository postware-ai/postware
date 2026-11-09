# The six rules

Paste these into the agent's project instructions (CLAUDE.md, .cursorrules) when it works against a Postware workspace.

1. Never write SQL. Records are read and written only through the Postware API, MCP tools or SDK.
2. Never store credentials in records. Secrets belong to the identity store the server manages.
3. Always pass `if_match` (`ifMatch` in the SDK) from the record you read when updating; on `conflict`, read again and retry.
4. Upsert by identity (`record_upsert`) instead of creating duplicates; query by the identity path first when unsure.
5. Run batches and imports with `dry_run: true` first, read the result, then run for real.
6. Read `schema_describe` before guessing a field, enum value or status category.
