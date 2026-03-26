# Branch Protection Setup (Manual)

If you didn't use `scripts/init-repo.sh`, configure these settings manually
in **GitHub → Settings → Branches → Add rule** for the `main` branch.

---

## Required settings

| Setting | Value | Why |
|---|---|---|
| Require a pull request before merging | ✅ | No direct commits to main |
| Required approving reviews | **1** (minimum) | At least one human reviews every change |
| Dismiss stale pull request approvals when new commits are pushed | ✅ | Re-review required after changes |
| Require review from Code Owners | ✅ | CODEOWNERS enforced |
| Require status checks to pass before merging | ✅ | CI must be green |
| Required status checks | `Lint & Type Check`, `Unit Tests` | See table below |
| Require branches to be up to date before merging | ✅ | No stale merges |
| Do not allow bypassing the above settings | ❌ | See bypass actors section below |
| Allow force pushes | ❌ | Prevents history rewriting |
| Allow deletions | ❌ | Prevents accidental branch deletion |

---

## Required vs informational checks

Not all CI checks should block a merge. Split them intentionally:

| Check | Type | Blocks merge? | Why |
|---|---|---|---|
| `Lint & Type Check` | **Required** | Yes | Fast, deterministic, always meaningful |
| `Unit Tests` | **Required** | Yes | Fast, deterministic, always meaningful |
| `E2E Tests` | Informational | No | Can be flaky, slow, environment-dependent |
| `LLM Evals` | Informational | No | Requires AWS, slow, threshold is advisory |

**To change a check from informational → required:**
GitHub UI: Settings → Branches → main → Edit → Required status checks → add the exact job name

**To demote a required check to informational** (e.g. if a test suite has become unreliable):
Remove it from the required list — but open an issue to fix the underlying flakiness.

The job names in required status checks must exactly match the `name:` field in `.github/workflows/ci.yml`.

---

## Bypass actors

Bypass actors can merge to `main` without required checks passing.
This is a last resort for genuine emergencies, not a convenience.

**How to add a bypass actor (GitHub UI):**
Settings → Branches → main → Edit → "Allow specified actors to bypass required pull requests" → add GitHub username

**How to add via CLI:**
```bash
gh api repos/my-org/my-repo/branches/main/protection \
  --method PATCH \
  --header "Accept: application/vnd.github+json" \
  --field bypass_pull_request_allowances='{"users":[{"login":"github-username"}],"teams":[]}'
```

**Rules for bypass actors:**
- Keep the list to 1-2 senior leads maximum
- Every bypass requires a post-mortem issue within 24 hours
- See `BYPASS_PROCEDURE.md` for the full procedure and issue template

---

## Secret scanning (repo-level)

**Settings → Security → Code security and analysis:**

| Setting | Value |
|---|---|
| Secret scanning | Enabled |
| Push protection | Enabled |
| Dependabot alerts | Enabled |
| Dependabot security updates | Enabled |

---

## Verify branch protection is working

```bash
# Force push should be rejected:
git push --force origin main

# Direct commit without PR should be rejected:
git checkout main
echo "test" >> README.md
git commit -am "test direct commit"
git push origin main

# Fake secret should be blocked by push protection:
echo "AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY" >> .env
git add .env && git commit -m "test secret" && git push
```

All three commands should fail. If any succeed, the protection is misconfigured.
