# Title
<PR Title>

## Summary
<What & why in 2–4 lines. Link relevant specs/deltas.>

## Risk
- [ ] None (docs/tooling only)
- [ ] Low
- [ ] Medium
- [ ] High

## Rollback
Single revert of this commit. No data migrations.

## Verification
```bash
npm run spec:path   # prints OpenAPI spec path or "No OpenAPI spec found; skipping"
# CI will lint OpenAPI if present and post results to the Summary (non-blocking).
```

## LOC Budget

| Component     |  + |  - |
| ------------- | -: | -: |
| Files changed |    |    |
| Total LOC     |    |    |

## Security (if endpoints changed)

* [ ] Idempotency-Key on writes
* [ ] RFC9457 Problem Details
* [ ] RBAC + audit on denials
* [ ] 429 with Retry-After
* [ ] Tenant RLS via BFF
* [ ] OpenAPI is source of truth (updated)

## Notes

<Anything reviewers should watch for.>
