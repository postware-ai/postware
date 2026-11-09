# Contributing

Thank you for helping. This file covers how a change moves from an idea to a release, what every commit must carry, and the terms under which contributions are accepted. Read it once; it is short.

## What lives where

- `standard/`: the models, value types, extension packs, default policies, importer manifests and conformance suite. Changes here change the standard that every implementation follows, so they have the strictest rules (below).
- `sdk/typescript`: the TypeScript SDK. The types in `src/types.ts` are generated from `standard/dist`; only the hand-written client is edited directly.
- `skill/` and `docs/`: the coding-agent skill and the specs.

## The flow

1. **Open an issue first** for anything larger than a typo or an obvious bug fix, so the change is agreed before the work is done. A change to the standard that is not additive (see "Changing the standard") starts as an RFC in `rfcs/` instead of an issue.
2. **Branch from `main`**, one topic per branch, and keep the branch small enough to review in one sitting.
3. **Make the change complete.** A schema change comes with its fixtures and test vectors and its `standard/CHANGELOG.md` entry. Do not leave half of a change for a later pull request.
4. **Open the pull request** with a description that says what changed and why, links the issue or RFC, and lists anything a reviewer should look at first. Every commit is signed off (next section).
5. **Review.** A maintainer reviews within a few days, runs the compatibility check and the conformance suite, and regenerates `standard/dist/`. Changes requested in review land as new commits on the branch; the branch is squashed on merge.

## Sign-off (DCO)

Every commit must carry a `Signed-off-by` line with your real name and an email address you control:

```
Signed-off-by: Firstname Lastname <you@example.com>
```

`git commit -s` adds it. The sign-off certifies the Developer Certificate of Origin, version 1.1 (https://developercertificate.org): that you wrote the contribution or otherwise have the right to submit it under the licence of this repository, and that you understand the contribution and your sign-off are public and kept with the project. Pull requests with unsigned commits are not merged.

## Contributor licence terms

The standard is included in the hosted service that Stealthmode LLC operates. For that to keep working with outside contributions, every contribution is accepted under these terms, which you agree to by submitting it:

1. **You keep your copyright.** Nothing here transfers ownership.
2. **You license the contribution under Apache-2.0**, the licence of this repository.
3. **You grant Stealthmode LLC** a perpetual, worldwide, non-exclusive, royalty-free, irrevocable licence to use, reproduce, modify, distribute and sublicense the contribution, and to **relicense it** under any terms, including inclusion in commercial and proprietary builds and in future versions of the project's licences.
4. **You certify** the Developer Certificate of Origin for the contribution by signing off each commit, as above.

These terms apply to schema, documentation, fixtures, code and every other contribution. If you contribute on behalf of an employer, make sure you are permitted to accept them.

## Changing the standard

The standard is versioned so that implementations can rely on it (`standard/README.md` has the full rules; `docs/spec/01-schema.md` section 4 is the source).

- **Minor, additive, no RFC:** a new optional field, a new enum value, a new index, a new event, a new model, a new extension declaration, a new default policy. Open a pull request with the YAML change, the fixtures and test vectors that exercise it, and a `standard/CHANGELOG.md` entry.
- **Major, RFC first:** making a field required, removing or renaming a field, removing an enum value, changing a type, changing identity rules, changing the envelope, changing the query grammar. Write `rfcs/NNNN-short-title.md` from the template in `rfcs/README.md`, get it accepted, then implement it as a new URN major (`urn:postware:<group>:<name>@2`); the previous major stays published, since an implementation on it never guesses at a record from a newer one.
- **Labels are free.** A model's `name` and `title` may change at any time; its URN never does within a major. A rename still needs a changelog entry because routes, tools and SDK types follow it.
- **Fixtures are fake.** Never put a real person, company, domain, address or identifier in `standard/conformance/`. Use `.example` domains and invented names.

## Reporting a security issue

Do not open a public issue for a vulnerability. Report it privately to the maintainers through the contact published on [postware.ai](https://postware.ai), and allow time for a fix before disclosure.
