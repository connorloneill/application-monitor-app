---
name: Bypass post-mortem
about: Required after every emergency merge that bypassed required CI checks
labels: bypass-postmortem
---

**PR that was bypassed:** #
**Bypassed by:** @
**Date/time:** YYYY-MM-DD HH:MM UTC

## What check was failing and why?

<!-- Was it a flaky test? Broken CI config? External dependency down? -->

## Why was an immediate merge necessary?

<!-- Production issue? Hard deadline? -->

## Risk of merging without the check passing

<!-- Low / Medium / High — and why -->

## Follow-up actions

- [ ] Fix the underlying CI issue by [date]
- [ ] Verify the merged change works correctly in [env]
- [ ] Add a test case if the CI failure masked a real bug
