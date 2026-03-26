# Emergency Bypass Procedure

Bypass actors can merge to `main` without required CI checks passing.
This exists for genuine emergencies — not for impatience.

---

## Who can bypass

Bypass actors are configured per-repo in GitHub branch protection settings.
See `BRANCH_PROTECTION_SETUP.md` to add or remove bypass actors.

Keep this list short: **1-2 senior leads maximum.**

---

## When bypass is appropriate

| Situation | Use bypass? |
|---|---|
| CI has a real bug and is blocking a safe, time-sensitive fix | Yes |
| Production is down and the fix is ready but CI is flaky | Yes |
| You don't want to wait for CI | No |
| Your tests are failing because of your own code changes | No |
| A reviewer is unavailable and you want to self-merge | No |

---

## Required steps when bypassing

Skipping checks is a choice with consequences. These steps create accountability:

1. **Merge the PR** using your bypass actor permissions
2. **Open a follow-up GitHub issue within 24 hours** using the template below
3. **Paste the issue link in the merged PR** as a comment

If you bypass without a post-mortem issue, it's a policy violation — not just a process miss.

---

## Post-mortem issue template

Title: `bypass: [brief description] — [date]`

```markdown
## Bypass post-mortem

**PR that was bypassed:** #___
**Bypassed by:** @username
**Date/time:** YYYY-MM-DD HH:MM UTC

## What check was failing and why?

<!-- Was it a flaky test? Broken CI config? External dependency down? -->

## Why was an immediate merge necessary?

<!-- Production issue? Hard deadline? -->

## What was the risk of merging without the check passing?

<!-- Low / Medium / High — and why -->

## Follow-up actions

- [ ] Fix the underlying CI issue by [date]
- [ ] Verify the merged change is working correctly in [env]
- [ ] Add a test case if the CI failure masked a real bug
```

---

## Adding or removing bypass actors

```bash
# Add a bypass actor (GitHub username)
gh api repos/my-org/my-repo/branches/main/protection \
  --method PATCH \
  --header "Accept: application/vnd.github+json" \
  --field bypass_pull_request_allowances='{"users":[{"login":"github-username"}],"teams":[]}'

# View current bypass actors
gh api repos/my-org/my-repo/branches/main/protection \
  --jq '.required_pull_request_reviews.bypass_pull_request_allowances'
```

Or via GitHub UI: **Settings → Branches → main → Edit → Allow specified actors to bypass required pull requests**
