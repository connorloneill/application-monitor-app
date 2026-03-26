#!/bin/bash
# init-repo.sh — Bootstrap a new project from this template and push to GitHub.
# Usage: ./scripts/init-repo.sh <github-org/repo-name> [bypass-actor-username]
#
# Arguments:
#   github-org/repo-name      Required. e.g. my-org/my-new-app
#   bypass-actor-username     Optional. GitHub username of the lead who can
#                             merge without required checks in emergencies.
#                             Add more bypass actors later via GitHub UI or
#                             docs/workflow/BRANCH_PROTECTION_SETUP.md
#
# Prerequisites:
#   - GitHub CLI installed and authenticated (gh auth login)
#   - Git configured with your name and email
#   - Node.js 20+

set -euo pipefail

REPO=$1
BYPASS_ACTOR=${2:-}

if [[ -z "$REPO" ]]; then
  echo "Usage: $0 <github-org/repo-name> [bypass-actor-username]"
  exit 1
fi

echo ""
echo "==> Creating GitHub repository: $REPO"
gh repo create "$REPO" --private --confirm

echo ""
echo "==> Initializing git"
git init
git add .
git commit -m "chore: initialize project from AI project template"

echo ""
echo "==> Pushing to GitHub"
git remote add origin "https://github.com/$REPO.git"
git branch -M main
git push -u origin main

echo ""
echo "==> Configuring branch protection on main"
echo "    Required checks (block merge if failing): Lint & Type Check, Unit Tests"
echo "    Informational checks (visible but never block): E2E Tests, LLM Evals"
gh api repos/$REPO/branches/main/protection \
  --method PUT \
  --header "Accept: application/vnd.github+json" \
  --field required_status_checks='{"strict":true,"contexts":["Lint & Type Check","Unit Tests"]}' \
  --field enforce_admins=false \
  --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true,"require_code_owner_reviews":true}' \
  --field restrictions=null \
  --field allow_force_pushes=false \
  --field allow_deletions=false

# Configure bypass actors if provided.
# Bypass actors can merge without required checks — use only for emergencies.
# Every bypass must be followed by a post-mortem issue (see docs/workflow/BYPASS_PROCEDURE.md).
if [[ -n "$BYPASS_ACTOR" ]]; then
  echo ""
  echo "==> Adding bypass actor: $BYPASS_ACTOR"
  echo "    This user can merge to main without required checks."
  echo "    Remind them: every bypass needs a post-mortem issue."

  # Fetch the user's GitHub ID
  ACTOR_ID=$(gh api users/$BYPASS_ACTOR --jq '.id')

  gh api repos/$REPO/branches/main/protection \
    --method PATCH \
    --header "Accept: application/vnd.github+json" \
    --field bypass_pull_request_allowances="$(printf '{"users":[{"id":%s}],"teams":[]}' "$ACTOR_ID")"

  echo "    To add more bypass actors later, see: docs/workflow/BRANCH_PROTECTION_SETUP.md"
fi

echo ""
echo "==> Enabling secret scanning and push protection"
gh api repos/$REPO \
  --method PATCH \
  --field security_and_analysis='{"secret_scanning":{"status":"enabled"},"secret_scanning_push_protection":{"status":"enabled"}}'

echo ""
echo "==> Setting up GitHub Actions secrets (add your values)"
echo "    Run these after setting up AWS:"
echo "    gh secret set AWS_REGION              --repo $REPO"
echo "    gh secret set AWS_ACCESS_KEY_ID       --repo $REPO"
echo "    gh secret set AWS_SECRET_ACCESS_KEY   --repo $REPO"
echo "    gh secret set BEDROCK_MODEL_ID        --repo $REPO"
echo "    gh secret set ECR_REPOSITORY          --repo $REPO"

echo ""
echo "==> Installing pre-commit hooks"
pip install pre-commit detect-secrets 2>/dev/null || true
detect-secrets scan > .secrets.baseline
git add .secrets.baseline
git commit -m "chore: add secrets baseline for detect-secrets"
git push
pre-commit install

echo ""
echo "Done! Repository ready at: https://github.com/$REPO"
echo ""
echo "Next steps:"
echo "  1. Add GitHub Actions secrets (commands above)"
echo "  2. Drop your RFI into docs/requirements/"
echo "  3. Fill in CLAUDE.md project overview"
echo "  4. Update CODEOWNERS with real GitHub usernames"
echo "  5. Set up GitHub MCP token (see docs/workflow/NEW_PROJECT_RUNBOOK.md Step 6)"
echo "  6. Run: cp .env.example .env && npm install && npm run dev"
