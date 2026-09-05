# Interclub Two-Round Format Design

## Goal

Interclub encounters using `FMT_201`, two sets to six games, must contain exactly two rounds. This applies to newly created encounters and existing in-progress encounters. Completed encounter history must remain unchanged.

## Approach

The format rules are the source of truth for interclub round counts. `FMT_201` declares two rounds, while both single-set formats declare three. New encounter creation builds its round list from this rule instead of a hardcoded array.

Stored encounter normalization trims excess rounds from in-progress interclub `FMT_201` encounters. The encounter store persists normalized data after loading, making the correction permanent. Completed encounters are normalized only for legacy format fields and retain all historical rounds.

Round navigation determines the last round from the actual round-array length. This removes the separate hardcoded assumption that round 3 is always final.

## Testing

Pure helper tests cover round-count lookup, round creation, normalization of in-progress `FMT_201` encounters, preservation of completed history, and preservation of three-round single-set interclub encounters. Existing test, lint, and build commands verify integration.

## Dependency Audit Repair

The npm 10.9.8 automatic audit fixer crashes inside Arborist while resolving Vitest peer dependencies. Direct vulnerable dependencies will be updated explicitly to compatible patched releases, allowing npm to construct a coherent lockfile without the failing bulk audit-fix path. The final verification includes a clean install, tests, build, and a fresh security audit. Any advisory requiring a breaking major upgrade will be reported separately rather than forced into this change without validation.
