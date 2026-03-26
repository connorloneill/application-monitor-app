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
- Print the `gh secret set` commands you need to run next (Step 5)

If you prefer to do it manually, see [BRANCH_PROTECTION_SETUP.md](BRANCH_PROTECTION_SETUP.md).

---

## Step 5 — Add GitHub Actions secrets

Run the commands that `init-repo.sh` printed at the end, or copy them from here:

```bash
gh secret set AWS_REGION              --repo my-org/my-new-app
gh secret set AWS_ACCESS_KEY_ID       --repo my-org/my-new-app
gh secret set AWS_SECRET_ACCESS_KEY   --repo my-org/my-new-app
gh secret set BEDROCK_MODEL_ID        --repo my-org/my-new-app
gh secret set ECR_REPOSITORY          --repo my-org/my-new-app
```

These are consumed by `.github/workflows/deploy.yml`.

---

## Step 6 — Set up GitHub MCP for Claude Code (optional)

This gives Claude Code direct access to GitHub — reading issues, PRs, CI results,
and Dependabot alerts — so it can diagnose failures and suggest fixes without you
copying logs manually.

### 6a. Generate a fine-grained GitHub token (one-time, per developer)

1. Go to `github.com/settings/tokens` → **Fine-grained tokens**
2. Resource owner → your org
3. Repository access → **Only select repositories** → add this repo
4. Permissions (read-only is sufficient for most use cases):
   - `checks:read`, `actions:read`, `contents:read`, `pull-requests:read`
   - `issues:write` (optional — lets Claude open issues)
5. Expiry → 90 days

### 6b. Create `.mcp.json` in the project root

Create a `.mcp.json` file in the repo root (it's already in `.gitignore`):

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "<your-token-here>"
      }
    }
  }
}
```

Replace `<your-token-here>` with the token from step 6a.

> **Security note:** `.mcp.json` contains your token and must never be committed.
> This template's `.gitignore` already excludes it. Verify with `git check-ignore .mcp.json`.

### 6c. Enable the server in Claude Code

Start or restart Claude Code, then:
1. Run `/mcp` — you should see the `github` server listed
2. Approve the server when prompted
3. Verify it shows as connected

Alternatively, if Claude Code prompts you to approve the server on startup, accept it.

### Alternative: global setup (shared across all projects)

If you prefer a single config for all repos, store the token in your shell
environment and use a global MCP config:

```bash
# Mac — store in keychain
security add-generic-password -a "$USER" -s GITHUB_TOKEN -w "ghp_your_token_here"
echo 'export GITHUB_PERSONAL_ACCESS_TOKEN=$(security find-generic-password -a "$USER" -s GITHUB_TOKEN -w)' >> ~/.zshrc

# Linux — add to ~/.bashrc (or use pass / 1Password CLI)
echo 'export GITHUB_PERSONAL_ACCESS_TOKEN="ghp_your_token_here"' >> ~/.bashrc
```

Then create `~/.mcp.json`:
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"]
    }
  }
}
```

The server will pick up `GITHUB_PERSONAL_ACCESS_TOKEN` from the environment automatically.

---

## Step 7 — Install dependencies and verify locally

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

## Step 8 — First feature branch

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

### Claude Code / MCP (if Step 6 was completed)
- [ ] `.mcp.json` exists in project root with the `github` server entry
- [ ] `.mcp.json` is ignored by git (`git check-ignore .mcp.json` prints the path)
- [ ] After restarting Claude Code, `/mcp` shows `github` as connected

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
