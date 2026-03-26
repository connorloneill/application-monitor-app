# New Project Runbook: Zero to First Push

Follow these steps in order every time you start a new AI application.
Target time: ~20 minutes from blank slate to protected repo with CI running.

---

## Step 1 — Copy the template

```bash
cp -r project-template/ my-new-app/
cd my-new-app/
```

Or if this template is a GitHub template repo:
```bash
gh repo create my-org/my-new-app --template my-org/project-template --private --clone
cd my-new-app/
```

---

## Step 2 — Drop in the RFI

Place the RFI document in `docs/requirements/`:
```
docs/requirements/rfi-original.pdf     ← the raw RFI
docs/requirements/rfi-summary.md       ← fill this in (template already exists)
```

Fill out `docs/requirements/rfi-summary.md` — key requirements, constraints,
must-haves, and out-of-scope items. This takes 15 minutes now and saves hours later.

---

## Step 3 — Configure the project

1. **`CLAUDE.md`** — update the project overview line and stack if different from default
2. **`.env.example`** — add any new env vars your project needs
3. **`client/src/config/version.ts`** and **`server/src/constants/versions.ts`** — set version to `1.0.0`
4. **`package.json`** (root) — update the `"name"` field
5. **`README.md`** — fill in the one-line description

---

## Step 4 — Initialize the repo and push

```bash
bash scripts/init-repo.sh my-org/my-new-app
```

This script will:
- Create the private GitHub repo
- Make the initial commit and push to `main`
- Configure branch protection (required reviews, no force push)
- Enable secret scanning + push protection
- Install pre-commit hooks (blocks secrets from being committed)

If you prefer to do it manually, see [BRANCH_PROTECTION_SETUP.md](BRANCH_PROTECTION_SETUP.md).

---

## Step 5 — Add GitHub Actions secrets

```bash
gh secret set AWS_REGION              --repo my-org/my-new-app
gh secret set AWS_ACCESS_KEY_ID       --repo my-org/my-new-app
gh secret set AWS_SECRET_ACCESS_KEY   --repo my-org/my-new-app
gh secret set BEDROCK_MODEL_ID        --repo my-org/my-new-app
gh secret set ECR_REPOSITORY          --repo my-org/my-new-app
```

These are consumed by `.github/workflows/deploy.yml`.

---

## Step 6 — Install dependencies and verify locally

```bash
cp .env.example .env
# Fill in your local values in .env

cd client && npm install && cd ..
cd server && npm install && cd ..
npm install   # root (concurrently)

npm run dev   # should start client on :5173 and server on :3000
```

Verify:
- [ ] `http://localhost:5173` loads the login page
- [ ] `http://localhost:3000/api/health` returns `{"status":"ok"}`

---

## Step 7 — First feature branch

Never commit directly to `main`. Always use a branch:

```bash
git checkout -b feature/my-first-feature
# do work
git add <specific files>   # never `git add .` — review what you're staging
git commit -m "feat: describe what and why"
git push -u origin feature/my-first-feature
gh pr create --fill
```

The PR will automatically:
- Run lint + type-check + unit tests (CI)
- Run LLM evals if you touched `prompts/`, `agents/`, or `evals/`
- Require 1 approving review before merge
- Block merge if checks fail

---

## Verification Checklist

Before calling the project "set up", confirm all of these:

### Security
- [ ] `.env` is in `.gitignore` and not committed
- [ ] `git log --oneline` shows no secrets in commit messages
- [ ] Secret scanning is enabled (check repo Settings → Security)
- [ ] Push protection blocked a test fake secret (try committing `TEST_KEY=AKIAIOSFODNN7EXAMPLE`)
- [ ] Branch protection is on `main` (Settings → Branches)

### CI
- [ ] A PR triggers the CI workflow and it passes
- [ ] Merging to `main` without a PR is blocked
- [ ] Force-push to `main` is blocked (`git push --force origin main` should fail)

### Local
- [ ] `bash scripts/check-all.sh` passes with no errors
- [ ] `npm run evals` completes (even with placeholder model call)
- [ ] Health endpoint returns `200 OK`

### Documentation
- [ ] `docs/requirements/rfi-summary.md` is filled in
- [ ] `CLAUDE.md` has the correct project name and stack
- [ ] `CODEOWNERS` has real GitHub usernames (not `@your-org/leads`)

---

## Ongoing workflow

```
main        protected — merge only via PR, all checks must pass
  └── develop       optional integration branch for multi-person teams
        └── feature/xyz     your daily work branch
        └── fix/abc         bug fix branch
```

| Branch type | Naming | From | Merges into |
|---|---|---|---|
| Feature | `feature/short-description` | `main` | `main` via PR |
| Bug fix | `fix/short-description` | `main` | `main` via PR |
| Hotfix | `hotfix/short-description` | `main` | `main` via PR (expedited review) |
| Release prep | `release/v1.2.0` | `main` | `main` via PR |

**Commit message format:**
```
type: short description (imperative, ≤72 chars)

Optional longer explanation of why, not what.
```
Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `ci`
