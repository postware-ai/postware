# RFCs

One Markdown file per proposed change to the standard. Until there are outside implementations, this folder and `standard/CHANGELOG.md` are the whole process: an RFC is written, discussed on its pull request, accepted or rejected, and implemented.

## When an RFC is needed

Any change that is **major** under the versioning rules (`docs/spec/01-schema.md` section 6): making a field required, removing or renaming a field, removing an enum value, changing a field's type, changing a model's identity rules, changing the envelope, changing the query grammar, or changing a value type in `standard/types.yaml`. Also: adding a new model or a new pack, since both commit every implementation to a model, even though they are technically additive.

**Not needed** for minor, additive changes: a new optional field, a new enum value, a new index, a new event, a new extension declaration, a new default policy, a new importer manifest, a rename of a `name` label with the URN unchanged. Those go straight to a pull request with a `standard/CHANGELOG.md` entry.

## Process

1. Copy the template below to `rfcs/NNNN-short-title.md`, where `NNNN` is the next free number (zero-padded, four digits) and the title is kebab-case.
2. Open a pull request containing only the RFC, with status `draft`. Discussion happens on the pull request.
3. A maintainer moves it to `accepted` or `rejected` and merges it either way, so the record of the decision is kept. An author may mark it `withdrawn`.
4. An accepted RFC is implemented in one or more pull requests that reference it: the YAML change, the note on how records move when a major, the fixtures and test vectors, the regenerated `standard/dist/`, and the changelog entry. When the last of them merges, the RFC's status becomes `implemented` and it names the standard version that carries the change.

Statuses: `draft`, `accepted`, `rejected`, `withdrawn`, `implemented`.

## Template

```markdown
# RFC NNNN: <title>

- Status: draft
- Author(s): <name>
- Created: <YYYY-MM-DD>
- Standard version affected: <x.y>, major: yes | no
- Models or types affected: <urn:postware:...>

## Summary

One paragraph: what changes and why it is worth a change to the standard.

## Motivation

The problem, who has it, and what happens if nothing changes. Cite the source
systems, vocabularies or implementations that show the need.

## Proposal

The exact change, in the meta-schema: fields, types, identity rules, status
categories, sensitivity, events, extension declarations or policies, written
as the YAML that would land in `standard/`. Name the URNs. For a rename, give
the old and new labels and say that the URN is unchanged.

## Compatibility

Minor or major, and why. For a major: the migration rule for existing records
(stated in the RFC itself), the alias period for old labels, and what an
implementation on the previous version does when it meets a record written on
the new one.

## Alternatives considered

What else would solve the problem, including an extension instead of a core
field, and why this proposal is better.

## Conformance

The fixtures and test vectors that will prove the change: validation, identity,
status, policy and round-trip cases.

## Open questions

What is still undecided and who decides it.
```
