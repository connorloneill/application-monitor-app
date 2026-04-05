# Claude Code — Project Guide

This file is read automatically by Claude Code at session start.
Keep it up to date as the project evolves.

## Project Overview

**What it does:** [One sentence description]
**Stack:** React + TypeScript (client) · Node.js + Express + TypeScript (server) · AWS Bedrock · DynamoDB
**Ports:** Client: 6110 · Server: 3000

## Requirements

This project was built in response to an RFI. Before making architectural or
feature decisions, review the original requirements:

- **Full RFI**: `docs/requirements/rfi-original.pdf` (or `.md`)
- **Key requirements summary**: `docs/requirements/rfi-summary.md`
- **Proposal/response**: `docs/requirements/response/`

Requirements in `docs/requirements/` are authoritative and override template defaults,
including the stack choices in this file. Do not add features or make design decisions
that conflict with these requirements without flagging the conflict first.

## Key Architecture Decisions

- See `docs/adr/` for Architecture Decision Records
- See `docs/architecture.md` for system design and data flow diagram

## Where Things Live

| Concern | Location |
|---|---|
| API endpoints | `server/src/routes/` |
| Business logic | `server/src/services/` |
| LLM prompt templates | `server/src/prompts/` |
| AI agent logic | `server/src/agents/` |
| LLM evaluation harness | `server/src/evals/` |
| Structured logging | `server/src/utils/logger.ts` |
| React pages | `client/src/pages/` |
| Reusable components | `client/src/components/` |
| API client calls | `client/src/services/` |
| Global state | `client/src/contexts/` |

## Development Workflow

- Run `npm run dev` from root to start both client and server
- Run `npm run evals` to execute the LLM evaluation harness
- All secrets go in `.env` (never commit — see `.env.example` for required vars)
- Feature docs live in `docs/in_progress/` while being built, move to `docs/completed/` when shipped
- **Starting a new project from this template**: see `docs/workflow/NEW_PROJECT_RUNBOOK.md`
- **Branch strategy**: feature branches only — never commit directly to `main`
- **Branch protection & security setup**: see `docs/workflow/BRANCH_PROTECTION_SETUP.md`

## Active Features

<!-- Update this section as work progresses -->
- [ ] [Feature being built]
