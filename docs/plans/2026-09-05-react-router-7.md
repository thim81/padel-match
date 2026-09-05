# React Router 7 Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace React Router DOM 6.30.6 with React Router 7.18.3 and clear the remaining security audit findings.

**Architecture:** Keep the application in declarative mode and migrate package imports only. React Router 7 exposes the browser components and hooks from `react-router`, so route definitions and behavior remain unchanged.

**Tech Stack:** React 18, TypeScript, React Router 7, Vite, Vitest

---

### Task 1: Establish migration failure

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

1. Install `react-router@7.18.3` and remove `react-router-dom`.
2. Run `npm test` and confirm imports fail because source files still reference the removed compatibility package.

### Task 2: Migrate imports

**Files:**
- Modify: all source and test files importing `react-router-dom`

1. Replace `react-router-dom` module specifiers with `react-router`.
2. Confirm `rg` finds no remaining `react-router-dom` imports.
3. Run `npm test` and confirm all tests pass.

### Task 3: Verify and review

**Files:**
- Modify: `PLAN.md`

1. Run `npm run lint`.
2. Run `npm run build`.
3. Run `npm ls --all --depth=0`.
4. Run `npm audit` and confirm zero vulnerabilities.
5. Run `git diff --check`.
6. Request code review and address any Critical or Important findings.
