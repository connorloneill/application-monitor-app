export const ARCHITECTURE_DIAGRAM = `graph TB
  Client["React Client<br/>(Port 6110)"]
  Nginx["nginx<br/>Reverse Proxy"]
  Express["Express Server<br/>(Port 3000)"]
  Auth["JWT Auth<br/>Middleware"]

  ProblemReports["Problem Reports<br/>Service"]
  DiagService["Diagnosis<br/>Service"]
  IssueService["Issue<br/>Service"]
  AppService["Application<br/>Service"]

  DiagAgent["Diagnosis Agent"]
  BroadScan["Broad Scan<br/>(Pass 1)"]
  DeepAnalysis["Deep Analysis<br/>(Pass 2)"]
  QuickDiag["Quick Diagnosis<br/>(Single Pass)"]

  PromptRegistry["Prompt Registry<br/>(Versioned)"]
  CodeRetrieval["Code Retrieval<br/>Tool"]
  Observability["Observability<br/>Hooks"]

  Bedrock["AWS Bedrock<br/>(Claude)"]
  DynamoDB[("DynamoDB")]
  GitHub["GitHub API"]
  S3["S3<br/>(Screenshots)"]

  Client --> Nginx
  Nginx --> Express
  Express --> Auth
  Auth --> ProblemReports
  Auth --> DiagService
  Auth --> IssueService
  Auth --> AppService

  DiagService --> DiagAgent
  DiagAgent --> BroadScan
  DiagAgent --> DeepAnalysis
  DiagAgent --> QuickDiag

  BroadScan --> PromptRegistry
  DeepAnalysis --> PromptRegistry
  QuickDiag --> PromptRegistry

  BroadScan --> Bedrock
  DeepAnalysis --> Bedrock
  QuickDiag --> Bedrock

  BroadScan --> Observability
  DeepAnalysis --> Observability
  QuickDiag --> Observability

  DiagAgent --> CodeRetrieval
  CodeRetrieval --> GitHub

  ProblemReports --> DynamoDB
  ProblemReports --> S3
  DiagService --> DynamoDB
  IssueService --> DynamoDB
  AppService --> DynamoDB
`

export const DYNAMO_TABLES = [
  {
    name: '{prefix}problem_reports',
    primaryKey: 'report_id',
    purpose: 'User-submitted problem reports with severity, description, and screenshots',
  },
  {
    name: '{prefix}issues',
    primaryKey: 'id',
    purpose: 'Tracked issues linked to applications with status, severity, and stack traces',
  },
  {
    name: '{prefix}diagnoses',
    primaryKey: 'id',
    purpose: 'AI-generated diagnosis results with root cause analysis and code snippets',
  },
  {
    name: '{prefix}applications',
    primaryKey: 'id',
    purpose: 'Monitored applications with repo URLs and configuration',
  },
  {
    name: '{prefix}ai_usage',
    primaryKey: 'id',
    purpose: 'LLM call tracking: tokens, latency, cost estimates per feature and model',
  },
  {
    name: '{prefix}ai_event_log',
    primaryKey: 'id',
    purpose: 'Detailed event log for LLM calls and system events',
  },
  {
    name: '{prefix}batch_results',
    primaryKey: 'id',
    purpose: 'Side-by-side diagnosis outputs from different models for comparison',
  },
  {
    name: '{prefix}batch_ratings',
    primaryKey: 'id',
    purpose: 'Star ratings and notes for batch comparison results',
  },
]

export const API_ROUTES = [
  { path: '/api/health', methods: 'GET', purpose: 'Health check and version info' },
  { path: '/api/auth', methods: 'POST', purpose: 'Login, token generation' },
  {
    path: '/api/problem-reports',
    methods: 'GET, POST, PATCH',
    purpose: 'CRUD for problem reports, screenshot upload',
  },
  { path: '/api/diagnoses', methods: 'GET, POST', purpose: 'Retrieve and trigger AI diagnoses' },
  { path: '/api/issues', methods: 'GET, POST, PATCH', purpose: 'Issue tracking and management' },
  { path: '/api/applications', methods: 'GET, POST', purpose: 'Monitored application management' },
  { path: '/api/dashboard', methods: 'GET', purpose: 'Analytics and dashboard data' },
  {
    path: '/api/dev-tools/*',
    methods: 'GET, POST, PUT',
    purpose: 'Dev tools: usage, chat, batch comparison, model overrides',
  },
]

export const AI_OPERATIONS = [
  {
    name: 'Broad Scan (Pass 1)',
    model: 'Claude Sonnet',
    transport: 'Sync',
    purpose: 'Analyzes file tree, identifies candidate files for deeper analysis',
  },
  {
    name: 'Deep Analysis (Pass 2)',
    model: 'Claude Sonnet',
    transport: 'Sync',
    purpose: 'Retrieves and analyzes actual code to produce root cause diagnosis',
  },
  {
    name: 'Quick Diagnosis',
    model: 'Claude Sonnet',
    transport: 'Sync',
    purpose: 'Single-pass diagnosis on issue context only (no code retrieval)',
  },
  {
    name: 'Developer Chat',
    model: 'Configurable',
    transport: 'SSE Stream',
    purpose: 'Architecture Q&A with full system context',
  },
]
