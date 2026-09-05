# Interclub Two-Round Format Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make two-set interclub encounters use exactly two rounds, migrate existing in-progress encounters, and repair the dependency audit without npm's crashing automatic fixer.

**Architecture:** Store interclub round count with each format rule and expose pure helpers for round creation and stored-encounter normalization. The encounter store persists normalized records, while round navigation derives completion from the actual array length. Direct dependency upgrades replace the failing bulk `npm audit fix` operation.

**Tech Stack:** React 18, TypeScript, Vitest, npm, Vite

---

### Task 1: Encode and test interclub round rules

**Files:**
- Modify: `src/lib/formatRules.ts`
- Create: `src/lib/encounterRounds.ts`
- Create: `src/test/encounterRounds.test.ts`

**Step 1: Write failing tests**

Add tests asserting that `FMT_201` creates rounds 1 and 2, and `FMT_101` creates rounds 1, 2, and 3.

**Step 2: Verify the tests fail**

Run: `npm test -- src/test/encounterRounds.test.ts`

Expected: FAIL because the new helper and rule field do not exist.

**Step 3: Implement the minimal round-rule helper**

Add `interclubRoundCount` to `FormatRule`, set it per format, and implement a helper that creates the declared number of rounds.

**Step 4: Verify the tests pass**

Run: `npm test -- src/test/encounterRounds.test.ts`

Expected: PASS.

### Task 2: Normalize existing in-progress encounters

**Files:**
- Modify: `src/lib/encounterRounds.ts`
- Modify: `src/hooks/useEncounterStore.ts`
- Modify: `src/test/encounterRounds.test.ts`

**Step 1: Write failing tests**

Add tests proving that an in-progress interclub `FMT_201` encounter is trimmed to two rounds, while completed `FMT_201` history and single-set interclub encounters are unchanged.

**Step 2: Verify the tests fail**

Run: `npm test -- src/test/encounterRounds.test.ts`

Expected: FAIL because stored encounters are not normalized by round rule.

**Step 3: Implement and persist normalization**

Implement a pure normalization helper. Apply it when the encounter store reads records, then persist only when normalization changed stored data.

**Step 4: Verify the tests pass**

Run: `npm test -- src/test/encounterRounds.test.ts`

Expected: PASS.

### Task 3: Use dynamic round counts in creation and navigation

**Files:**
- Modify: `src/pages/NewEncounter.tsx`
- Modify: `src/pages/RoundPage.tsx`

**Step 1: Replace hardcoded creation**

Use the tested round-creation helper for new interclub encounters.

**Step 2: Replace hardcoded final-round detection**

Treat the current round as final when its index equals `encounter.rounds.length - 1`.

**Step 3: Run focused and complete tests**

Run: `npm test`

Expected: all tests pass.

### Task 4: Repair vulnerable dependencies explicitly

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

**Step 1: Query patched compatible releases**

Use npm registry metadata and audit output to select patched versions of direct dependencies.

**Step 2: Install explicit versions**

Run an explicit `npm install` for affected direct packages instead of `npm audit fix`.

Expected: npm completes without the Arborist `edgesOut` exception and produces a coherent lockfile.

**Step 3: Verify the dependency tree**

Run: `npm ls --all`

Expected: exit 0 with no invalid dependencies.

**Step 4: Re-run the audit**

Run: `npm audit`

Expected: no fixable vulnerabilities within the selected compatible dependency set. Document any advisory that requires a breaking major upgrade.

### Task 5: Full verification

**Files:**
- Modify: `PLAN.md`

**Step 1: Run tests**

Run: `npm test`

Expected: all tests pass.

**Step 2: Run lint**

Run: `npm run lint`

Expected: exit 0.

**Step 3: Run the production build**

Run: `npm run build`

Expected: exit 0.

**Step 4: Update repository plan**

Mark all completed tasks and verification checks in `PLAN.md`.
