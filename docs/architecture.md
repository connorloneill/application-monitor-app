# Architecture

## System Overview

```
[Client: React + Vite]  →  [nginx]  →  [Server: Express + TypeScript]
                                              ↓
                                        [AWS Bedrock]   (AI/LLM)
                                        [DynamoDB]      (Data)
                                        [S3]            (Storage)
```

## Data Flow

1. User authenticates via `/api/auth/login` → receives JWT
2. Client attaches JWT to all subsequent requests
3. Server validates JWT in `middleware/auth.ts`
4. Business logic lives in `services/` — routes are thin handlers only
5. LLM calls go through `services/aws/` → `utils/observability.ts` traces every call

## Key Design Decisions

See `docs/adr/` for Architecture Decision Records.

## Ports

| Service | Port |
|---|---|
| Client (dev) | 6110 |
| Server | 3000 |
| nginx (docker) | 80 |
