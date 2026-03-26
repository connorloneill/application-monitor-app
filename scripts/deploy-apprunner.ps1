# Deploy to AWS App Runner
# Usage: .\scripts\deploy-apprunner.ps1 -ServiceName "my-ai-app" -Region "us-east-1"

param(
  [Parameter(Mandatory=$true)] [string]$ServiceName,
  [string]$Region = "us-east-1",
  [string]$ImageTag = (git rev-parse --short HEAD)
)

$ECR_URI = (aws ecr describe-repositories --repository-names $ServiceName --region $Region --query 'repositories[0].repositoryUri' --output text)

Write-Host "Building and pushing image $ImageTag to $ECR_URI..."
aws ecr get-login-password --region $Region | docker login --username AWS --password-stdin $ECR_URI
docker build -f infrastructure/docker/Dockerfile.server -t "${ECR_URI}:${ImageTag}" .
docker push "${ECR_URI}:${ImageTag}"

Write-Host "Deploying to App Runner..."
aws apprunner start-deployment --service-arn (aws apprunner list-services --query "ServiceSummaryList[?ServiceName=='$ServiceName'].ServiceArn" --output text --region $Region) --region $Region

Write-Host "Deployment triggered. Monitor at: https://$Region.console.aws.amazon.com/apprunner"
