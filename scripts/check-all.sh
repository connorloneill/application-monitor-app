#!/bin/bash
# Pre-deploy verification script
set -e

echo "==> Type-checking client..."
cd client && npx tsc --noEmit && cd ..

echo "==> Type-checking server..."
cd server && npx tsc --noEmit && cd ..

echo "==> Linting client..."
cd client && npm run lint && cd ..

echo "==> Running server tests..."
cd server && npm test && cd ..

echo "==> All checks passed."
