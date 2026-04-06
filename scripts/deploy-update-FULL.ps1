# Full Deploy Pipeline: git pull → build → Docker → ECR → App Runner
# Usage: .\scripts\deploy-update-FULL.ps1 -ServiceName "application-monitor"

param(
  [Parameter(Mandatory=$true)] [string]$ServiceName,
  [string]$Region = "us-east-1",
  [string]$EcrRepoName = $ServiceName,
  [switch]$SkipTests
)

$ErrorActionPreference = "Stop"
$startTime = Get-Date

function Write-Step($step, $message) {
  Write-Host "`n[$step] $message" -ForegroundColor Cyan
}

function Write-Ok($message) {
  Write-Host "  ✓ $message" -ForegroundColor Green
}

function Write-Err($message) {
  Write-Host "  ✗ $message" -ForegroundColor Red
}

# ── Step 1: Detect App Runner service ────────────────────────────────────
Write-Step 1 "Detecting App Runner service..."
$ServiceArn = (aws apprunner list-services --query "ServiceSummaryList[?ServiceName=='$ServiceName'].ServiceArn" --output text --region $Region)
if (-not $ServiceArn -or $ServiceArn -eq "None") {
  Write-Host "  ⚠ App Runner service '$ServiceName' not found. Will push image only." -ForegroundColor Yellow
  $ServiceArn = $null
} else {
  Write-Ok "Found service: $ServiceArn"
}

# ── Step 2: Capture current version ──────────────────────────────────────
Write-Step 2 "Reading version..."
$versionFile = "server/src/constants/versions.ts"
if (Test-Path $versionFile) {
  $versionContent = Get-Content $versionFile -Raw
  if ($versionContent -match "'([^']+)'") {
    $appVersion = $Matches[1]
  } else {
    $appVersion = "unknown"
  }
} else {
  $appVersion = "unknown"
}
$gitSha = git rev-parse --short HEAD
Write-Ok "Version: $appVersion (commit: $gitSha)"

# ── Step 3: Clean dist directories ───────────────────────────────────────
Write-Step 3 "Cleaning dist directories..."
Remove-Item -Recurse -Force client/dist -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force server/dist -ErrorAction SilentlyContinue
Write-Ok "Cleaned"

# ── Step 4: Git pull ─────────────────────────────────────────────────────
Write-Step 4 "Pulling latest code..."
$branch = git branch --show-current
git pull origin $branch
Write-Ok "Pulled from origin/$branch"

# ── Step 5: Install dependencies ─────────────────────────────────────────
Write-Step 5 "Installing dependencies..."
npm ci
Set-Location client; npm ci; Set-Location ..
Set-Location server; npm ci; Set-Location ..
Write-Ok "Dependencies installed"

# ── Step 6: Run pre-deploy checks ────────────────────────────────────────
if (-not $SkipTests) {
  Write-Step 6 "Running pre-deploy checks..."
  bash scripts/check-all.sh
  if ($LASTEXITCODE -ne 0) {
    Write-Err "Pre-deploy checks failed. Use -SkipTests to bypass."
    exit 1
  }
  Write-Ok "All checks passed"
} else {
  Write-Step 6 "Skipping pre-deploy checks (-SkipTests)"
}

# ── Step 7: Build client and server ──────────────────────────────────────
Write-Step 7 "Building client and server..."
npm run build
Write-Ok "Build complete"

# ── Step 8: Verify build outputs ─────────────────────────────────────────
Write-Step 8 "Verifying build outputs..."
if (-not (Test-Path "server/dist/index.js")) {
  Write-Err "server/dist/index.js not found"
  exit 1
}
if (-not (Test-Path "client/dist/index.html")) {
  Write-Err "client/dist/index.html not found"
  exit 1
}
Write-Ok "Build artifacts verified"

# ── Step 9: Docker build ─────────────────────────────────────────────────
Write-Step 9 "Building Docker image..."
docker build --no-cache -f infrastructure/docker/Dockerfile.combined -t "${EcrRepoName}:latest" .
Write-Ok "Docker image built"

# ── Step 10: ECR login ───────────────────────────────────────────────────
Write-Step 10 "Logging into ECR..."
$AccountId = (aws sts get-caller-identity --query Account --output text)
$EcrUri = "${AccountId}.dkr.ecr.${Region}.amazonaws.com"
aws ecr get-login-password --region $Region | docker login --username AWS --password-stdin $EcrUri
Write-Ok "ECR login successful"

# ── Step 11: Check/create ECR repository ─────────────────────────────────
Write-Step 11 "Checking ECR repository..."
try {
  aws ecr describe-repositories --repository-names $EcrRepoName --region $Region | Out-Null
  Write-Ok "Repository '$EcrRepoName' exists"
} catch {
  Write-Host "  Creating repository '$EcrRepoName'..." -ForegroundColor Yellow
  aws ecr create-repository --repository-name $EcrRepoName --region $Region | Out-Null
  Write-Ok "Repository created"
}

# ── Step 12: Tag and push ────────────────────────────────────────────────
Write-Step 12 "Tagging and pushing image..."
$fullUri = "${EcrUri}/${EcrRepoName}"
docker tag "${EcrRepoName}:latest" "${fullUri}:latest"
docker tag "${EcrRepoName}:latest" "${fullUri}:${gitSha}"
docker push "${fullUri}:latest"
docker push "${fullUri}:${gitSha}"
Write-Ok "Pushed ${fullUri}:latest and ${fullUri}:${gitSha}"

# ── Step 13: Deploy to App Runner ────────────────────────────────────────
if ($ServiceArn) {
  Write-Step 13 "Triggering App Runner deployment..."
  aws apprunner start-deployment --service-arn $ServiceArn --region $Region | Out-Null

  $maxAttempts = 60
  $attempt = 0
  while ($attempt -lt $maxAttempts) {
    $attempt++
    $status = (aws apprunner describe-service --service-arn $ServiceArn --region $Region --query 'Service.Status' --output text)
    Write-Host "  Status: $status (attempt $attempt/$maxAttempts)" -ForegroundColor Gray

    if ($status -eq "RUNNING") {
      Write-Ok "Deployment successful!"
      break
    }
    if ($status -match "FAILED") {
      Write-Err "Deployment failed with status: $status"
      exit 1
    }
    Start-Sleep -Seconds 15
  }

  if ($attempt -ge $maxAttempts) {
    Write-Err "Deployment timed out after 15 minutes"
    exit 1
  }
} else {
  Write-Step 13 "Skipping App Runner deployment (no service found)"
}

# ── Summary ──────────────────────────────────────────────────────────────
$elapsed = (Get-Date) - $startTime
Write-Host "`n════════════════════════════════════════" -ForegroundColor Green
Write-Host "  Deployment complete!" -ForegroundColor Green
Write-Host "  Version:  $appVersion" -ForegroundColor Green
Write-Host "  Commit:   $gitSha" -ForegroundColor Green
Write-Host "  Image:    ${fullUri}:${gitSha}" -ForegroundColor Green
Write-Host "  Elapsed:  $([math]::Round($elapsed.TotalMinutes, 1)) minutes" -ForegroundColor Green
Write-Host "════════════════════════════════════════" -ForegroundColor Green
