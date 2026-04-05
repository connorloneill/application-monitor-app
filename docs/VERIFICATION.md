# End-to-End Read Verification

## Prerequisites

- `.env` configured in `server/` with valid `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`
- IAM user has `dynamodb:Scan`, `dynamodb:Query`, `dynamodb:GetItem` on `problem_reports` table + GSI
- IAM user has `s3:GetObject` on `problem-reports-screenshots` bucket

## 1. List all problem reports (Scan)

```bash
cd server
node -e "
require('dotenv').config();
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const client = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION }));

client.send(new ScanCommand({ TableName: 'problem_reports' }))
  .then(r => {
    console.log('Total reports:', r.Count);
    r.Items.forEach(i => console.log(' -', i.report_id, '|', i.app_name, '|', i.severity, '|', i.description?.slice(0, 60)));
  })
  .catch(e => console.error('Error:', e.message));
"
```

**Expected:** List of reports with `report_id`, `app_name`, `severity`, `description`.

## 2. Query reports by app name (GSI)

```bash
node -e "
require('dotenv').config();
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const client = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION }));

client.send(new QueryCommand({
  TableName: 'problem_reports',
  IndexName: 'app-name-index',
  KeyConditionExpression: 'app_name = :appName',
  ExpressionAttributeValues: { ':appName': 'CORTEX' },
}))
  .then(r => {
    console.log('CORTEX reports:', r.Count);
    r.Items.forEach(i => console.log(' -', i.report_id, '|', i.severity, '|', i.description?.slice(0, 60)));
  })
  .catch(e => console.error('Error:', e.message));
"
```

**Expected:** Only reports where `app_name = CORTEX`.

## 3. Get a single report by ID

Replace `<REPORT_ID>` with a real `report_id` from step 1.

```bash
node -e "
require('dotenv').config();
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');
const client = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION }));

client.send(new GetCommand({ TableName: 'problem_reports', Key: { report_id: '<REPORT_ID>' } }))
  .then(r => console.log(JSON.stringify(r.Item, null, 2)))
  .catch(e => console.error('Error:', e.message));
"
```

**Expected:** Full report object with all fields.

## 4. Get a screenshot presigned URL (S3)

Only applicable for reports where `screenshot_key` is not null. Replace `<SCREENSHOT_KEY>` with a real value (e.g., `CORTEX/PRB-22593443/Screenshot 2026-03-31 123607.png`).

```bash
node -e "
require('dotenv').config();
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const s3 = new S3Client({ region: process.env.AWS_REGION });

const command = new GetObjectCommand({
  Bucket: process.env.PROBLEM_REPORTS_BUCKET || 'problem-reports-screenshots',
  Key: '<SCREENSHOT_KEY>',
});
getSignedUrl(s3, command, { expiresIn: 300 })
  .then(url => console.log('Presigned URL:', url))
  .catch(e => console.error('Error:', e.message));
"
```

**Expected:** A presigned S3 URL that opens the screenshot in a browser.

## 5. Server API test

Start the server and hit the API endpoints:

```bash
# Start server
npm run dev

# In another terminal — login first
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@test.com","password":"demo"}' | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).token")

# List all reports
curl -s http://localhost:3000/api/problem-reports \
  -H "Authorization: Bearer $TOKEN" | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8'))"

# List distinct app names
curl -s http://localhost:3000/api/problem-reports/apps \
  -H "Authorization: Bearer $TOKEN"

# Query by app name
curl -s http://localhost:3000/api/problem-reports/app/CORTEX \
  -H "Authorization: Bearer $TOKEN"

# Get single report (replace ID)
curl -s http://localhost:3000/api/problem-reports/<REPORT_ID> \
  -H "Authorization: Bearer $TOKEN"

# Get screenshot URL (replace ID — must have a screenshot)
curl -s http://localhost:3000/api/problem-reports/<REPORT_ID>/screenshot \
  -H "Authorization: Bearer $TOKEN"
```

## DynamoDB Table Schema Reference

| Field | Type | Notes |
|---|---|---|
| `report_id` | S | Partition key, e.g. `PRB-F68A9949` |
| `app_name` | S | GSI `app-name-index` PK, e.g. `CORTEX` |
| `user_id` | S | Who reported |
| `user_name` | S | Display name |
| `severity` | S | `CRITICAL` / `HIGH` / `MEDIUM` / `LOW` |
| `description` | S | Free-text problem description |
| `page_url` | S | URL where problem was reported |
| `user_agent` | S | Browser user agent |
| `screenshot_key` | S/null | S3 key or null |
| `created_at` | S | ISO 8601 timestamp |
| `status` | S | `new` / `reviewed` / `resolved` (may be absent) |
