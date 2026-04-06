# Quick Deploy: Docker build → ECR push → App Runner (skips git/npm/tests)
# Usage: .\scripts\deploy-docker-only.ps1 -ServiceName "application-monitor"

param(
  [Parameter(Mandatory=$true)] [string]$ServiceName,
  [string]$Region = "us-east-1",
  [string]$EcrRepoName = $ServiceName
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

$gitSha = git rev-parse --short HEAD

# ── Step 1: Detect App Runner service ────────────────────────────────────
Write-Step 1 "Detecting App Runner service..."
$ServiceArn = (aws apprunner list-services --query "ServiceSummaryList[?ServiceName=='$ServiceName'].ServiceArn" --output text --region $Region)
if (-not $ServiceArn -or $ServiceArn -eq "None") {
  Write-Host "  ⚠ App Runner service '$ServiceName' not found. Will push image only." -ForegroundColor Yellow
  $ServiceArn = $null
} else {
  Write-Ok "Found service: $ServiceArn"
}

# ── Step 2: Docker build ─────────────────────────────────────────────────
Write-Step 2 "Building Docker image..."
docker build --no-cache -f infrastructure/docker/Dockerfile.combined -t "${EcrRepoName}:latest" .
Write-Ok "Docker image built"

# ── Step 3: ECR login ────────────────────────────────────────────────────
Write-Step 3 "Logging into ECR..."
$AccountId = (aws sts get-caller-identity --query Account --output text)
$EcrUri = "${AccountId}.dkr.ecr.${Region}.amazonaws.com"
aws ecr get-login-password --region $Region | docker login --username AWS --password-stdin $EcrUri
Write-Ok "ECR login successful"

# ── Step 4: Tag and push ─────────────────────────────────────────────────
Write-Step 4 "Tagging and pushing image..."
$fullUri = "${EcrUri}/${EcrRepoName}"
docker tag "${EcrRepoName}:latest" "${fullUri}:latest"
docker tag "${EcrRepoName}:latest" "${fullUri}:${gitSha}"
docker push "${fullUri}:latest"
docker push "${fullUri}:${gitSha}"
Write-Ok "Pushed ${fullUri}:latest and ${fullUri}:${gitSha}"

# ── Step 5: Deploy to App Runner ─────────────────────────────────────────
if ($ServiceArn) {
  Write-Step 5 "Triggering App Runner deployment..."
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
  Write-Step 5 "Skipping App Runner deployment (no service found)"
}

# ── Summary ──────────────────────────────────────────────────────────────
$elapsed = (Get-Date) - $startTime
Write-Host "`n════════════════════════════════════════" -ForegroundColor Green
Write-Host "  Quick deploy complete!" -ForegroundColor Green
Write-Host "  Commit:   $gitSha" -ForegroundColor Green
Write-Host "  Image:    ${fullUri}:${gitSha}" -ForegroundColor Green
Write-Host "  Elapsed:  $([math]::Round($elapsed.TotalMinutes, 1)) minutes" -ForegroundColor Green
Write-Host "════════════════════════════════════════" -ForegroundColor Green
