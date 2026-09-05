# React Router 7 Migration Design

## Goal

Upgrade the application from React Router 6.30.6 to the fixed React Router 7.18.3 release and remove the compatibility-only `react-router-dom` dependency.

## Approach

Install `react-router` 7.18.3 as the direct dependency. Replace every application and test import from `react-router-dom` with `react-router`, whose v7 package now provides the browser APIs used by this declarative-mode application. Remove `react-router-dom` after all imports have moved.

No routing architecture, route definitions, or navigation behavior will change. Existing route tests provide migration coverage, while the complete test, lint, build, dependency-tree, and audit checks validate compatibility and security.

## Success Criteria

- No source or test file imports `react-router-dom`.
- `react-router` 7.18.3 is the only direct router dependency.
- Existing routing behavior tests pass.
- Lint and production build pass.
- `npm ls` reports a valid dependency tree.
- `npm audit` reports zero vulnerabilities.
