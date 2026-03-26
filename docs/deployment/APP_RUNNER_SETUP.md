# AWS App Runner Deployment

## Prerequisites

- AWS CLI configured with appropriate IAM permissions
- ECR repository created
- Secrets configured in AWS Secrets Manager or as App Runner env vars

## Steps

1. Build and push Docker image:
   ```bash
   .\scripts\deploy-apprunner.ps1 -ServiceName "my-ai-app"
   ```

2. First-time setup: create App Runner service pointing to your ECR image

3. Set environment variables in App Runner console (match `.env.example`)

## Environment Variables Required

See `server/.env.example` for the full list.

## Health Check

App Runner will probe `GET /api/health` — ensure it returns `200 OK`.
