# My AI Project

> One-line description of the project.

## Quick Start

```bash
cp .env.example .env          # Fill in your env vars
npm install                   # Install root deps
cd client && npm install      # Install client deps
cd ../server && npm install   # Install server deps
cd .. && npm run dev          # Start both client + server
```

- **Client**: http://localhost:5173
- **Server**: http://localhost:3000
- **Health check**: http://localhost:3000/api/health

## Architecture

See [`docs/architecture.md`](docs/architecture.md) for system design and data flow.

## Requirements

This project was built in response to an RFI. See [`docs/requirements/`](docs/requirements/).

## Project Structure

```
├── client/          React + TypeScript frontend
├── server/          Node.js + Express backend
├── infrastructure/  Docker, nginx, deployment configs
├── tests/e2e/       Playwright end-to-end tests
├── scripts/         Build and deployment scripts
└── docs/            Architecture, ADRs, requirements, feature docs
```

## Deployment

See [`docs/deployment/`](docs/deployment/) for environment-specific guides.
