# GitHub Copilot Instructions - CUET Micro-Ops Hackathon 2025

## Project Context
This is a hackathon submission for CUET Micro-Ops Hackathon 2025 (Dec 12, 9 AM - 6 PM). The project is a microservices-based download service with S3 storage integration, observability, and distributed tracing.

## Tech Stack
- **Runtime**: Node.js >= 24.10.0 with native TypeScript support (`--experimental-transform-types`)
- **Framework**: Hono v4.10.8 (ultra-fast web framework)
- **Storage**: AWS S3 SDK v3.948.0 with MinIO compatibility
- **Observability**: OpenTelemetry SDK v0.208.0 + Jaeger all-in-one v1.76.0, Sentry v1.2.2
- **Validation**: Zod v4.1.13 with OpenAPI integration via @hono/zod-openapi
- **Containerization**: Docker Compose with MinIO, Jaeger, and application services

## Architecture Patterns
- Microservices download service with simulated long-running operations (10-120s delays)
- Health check endpoint with S3 connectivity verification
- Rate limiting, CORS, security headers middleware
- Graceful shutdown handling with OpenTelemetry trace flushing
- S3-compatible storage (MinIO) for file management

## Important Conventions

### Environment Variables
- Use Docker Compose `env_file` injection, NOT `--env-file` flag in Node scripts
- `.env` is in `.dockerignore` - never reference it in package.json scripts
- S3 configuration: `S3_ENDPOINT`, `S3_BUCKET_NAME`, `S3_FORCE_PATH_STYLE=true`

### TypeScript Configuration
- No build step required - uses `--experimental-transform-types` flag
- Run directly with: `node --experimental-transform-types src/index.ts`
- Watch mode available with `--watch` flag

### Docker Compose Structure
- `docker/compose.dev.yml` - Development with faster delays (5-15s)
- `docker/compose.prod.yml` - Production with realistic delays (10-120s)
- Services: `delineate-app`, `delineate-minio`, `delineate-minio-init`, `delineate-jaeger`
- Network: `delineate-network` (bridge)

### Git Workflow
- Development branch: `rupak`
- Local changes → push to `rupak` → pull on VM → rebuild → test
- VM deployment: Ubuntu 22.04 on Brilliant Cloud (IP: 36.255.70.210)

## Hackathon Challenges

### ✅ Challenge 1: S3 Storage Integration (15 points) - COMPLETED
- MinIO service with bucket auto-creation via `minio-init` container
- Health endpoint returns `{"status":"healthy","checks":{"storage":"ok"}}`
- All 29 E2E tests passing

### 🎯 Challenge 3: CI/CD Pipeline (10 points) - NEXT TARGET
- Enhance `.github/workflows/ci.yml` with:
  - Dependency caching (actions/cache@v3)
  - Parallel job execution for lint and test
  - Docker build stage with docker/build-push-action
  - Status badge in README.md
- Must trigger on push to main/master and pull requests
- Run linting, format check, E2E tests, build Docker image

### 📋 Challenge 2: Architecture Design Document (15 points)
- Create `ARCHITECTURE.md` in repository root
- Document integration approach for fullstack app with variable download times
- Choose pattern: Polling, WebSockets, or SSE
- Include architecture diagram, API contracts, implementation plan

### 🎁 Challenge 4: Observability Dashboard (10 points bonus)
- Build React UI integrating Sentry error tracking and OpenTelemetry tracing
- Display health status, trace IDs, error boundaries

## Key Files

### src/index.ts
- Main application entry point
- S3Client initialization (lines 53-66)
- Health checks: `checkS3Health()` (lines 269-280), `checkS3Availability()` (lines 283-320)
- API routes: root, health, download endpoints
- OpenTelemetry and Sentry middleware integration

### docker/compose.dev.yml
- MinIO on ports 9000 (API), 9001 (Console)
- Credentials: minioadmin/minioadmin
- Bucket "downloads" auto-created with public access
- Health checks with 10s interval

### scripts/e2e-test.ts
- Comprehensive test suite (29 tests)
- Tests health endpoint, security headers, download flows, rate limiting
- Run with: `npm run test:e2e`

## Development Commands
```bash
# Install dependencies
npm install

# Development (fast delays)
npm run dev

# Production mode (realistic delays)
npm start

# Run E2E tests
npm run test:e2e

# Docker Compose (development)
docker compose -f docker/compose.dev.yml up --build

# Docker Compose (production)
docker compose -f docker/compose.prod.yml up -d
```

## Deployment Context
- **VM Provider**: Brilliant Cloud (InterCloud Limited, Bangladesh)
- **VM Specs**: 2 vCPU, 8GB RAM, 50GB SSD, Ubuntu 22.04 LTS
- **Floating IP**: 36.255.70.210
- **Open Ports**: 22 (SSH), 80 (HTTP), 3000 (API), 4318 (OTLP), 9000 (MinIO API), 9001 (MinIO Console), 16686 (Jaeger UI)
- **Access**: SSH via `micro-ops-key.pem`, VS Code Remote-SSH enabled

## Code Quality Guidelines
- Use Zod schemas for validation with proper OpenAPI documentation
- Implement proper error handling with Sentry integration
- Add OpenTelemetry trace context to all operations
- Follow Hono middleware patterns for cross-cutting concerns
- Use proper TypeScript types (avoid implicit any)
- Sanitize S3 keys: `downloads/${fileId}.zip` pattern

## Testing Requirements
- All E2E tests must pass before submission
- Health endpoint must verify S3 connectivity
- Rate limiting must be enforced (100 requests per 15 minutes)
- Security headers must be present
- CORS must allow specified origins

## Scoring Strategy
1. **Priority 1**: Challenge 3 (CI/CD) - Quick 10 points with objective criteria
2. **Priority 2**: Challenge 2 (Architecture) - 15 points, needs quality documentation
3. **Priority 3**: Challenge 4 (Observability) - Bonus only if time permits

Target: 40+ points for competitive standing (current: 15/50)
