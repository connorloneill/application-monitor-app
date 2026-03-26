# Security Policy

## Reporting a vulnerability

Do **not** open a public GitHub issue for security vulnerabilities.

Email the maintainers directly at: [security@your-org.com]

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact

You will receive a response within 48 hours. We ask that you give us reasonable
time to patch before public disclosure.

## Security practices in this codebase

- **Secrets**: All secrets are stored in environment variables, never committed.
  See `.env.example` for required vars. Production secrets live in AWS Secrets Manager.
- **Authentication**: JWT with configurable expiry (`JWT_EXPIRES_IN`).
- **Authorization**: Role-based access control enforced in `server/src/middleware/`.
- **Dependencies**: Dependabot monitors for vulnerable packages weekly.
- **Secret scanning**: GitHub secret scanning is enabled on this repo.
- **Pre-commit hooks**: `detect-secrets` runs locally before every commit.
- **Headers**: Helmet.js sets secure HTTP headers on every response.
