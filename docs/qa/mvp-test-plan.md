# Test Plan: MVP Backend

**Tester**: QA Agent  
**Date**: 2026-03-07  
**Target**: Backend API (src/)  
**Spec**: docs/specs/mvp-testspec.md  

## Test Order

1. **Smoke** — Health check, server starts, auth flow works
2. **Unit** — Business logic: pricing calculation, status transitions
3. **Integration** — API ↔ DB: customer CRUD, job CRUD, expense CRUD
4. **E2E** — Full flows: register → create customer → create job → advance status → reports
5. **Edge Cases** — Invalid input, auth failure, rate limits, boundary conditions
6. **Performance** — Response time under load (NFR-003)

## Environment

- Local: Node.js + PostgreSQL
- Test runner: vitest
- API testing: curl / httpie

## Priority Test Cases (from testspec)

| TC | Description | Risk |
|---|---|---|
| TC-001 | Registration + login flow | HIGH |
| TC-005 | Job create with auto-pricing | HIGH |
| TC-006 | Job status transitions (forward-only) | HIGH |
| TC-010 | Customer follow-up detection | MEDIUM |
| TC-015 | Monthly financial reports | MEDIUM |
| TC-020 | Bulk notification send | HIGH |
| TC-025 | Rate limiting enforcement | MEDIUM |
