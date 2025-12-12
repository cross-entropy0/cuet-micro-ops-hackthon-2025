# Copilot Instructions - Delineate Hackathon Challenge

## Project Overview
This is a Node.js microservice (Hono framework) simulating a real-world file download system with variable processing times (10-120s). The service demonstrates long-running operation challenges behind reverse proxies (Cloudflare timeouts, 504 errors). Built for CUET Micro-Ops Hackathon 2025.

## Architecture
- **Framework**: Hono (OpenAPI-based TypeScript web framework)
- **Runtime**: Node.js 24+ with `--experimental-transform-types` (no build step, direct TS execution)
- **Storage**: S3-compatible (MinIO/RustFS) via `@aws-sdk/client-s3`
- **Observability**: OpenTelemetry (Jaeger) + Sentry error tracking
- **Container Stack**: Docker Compose with minio, jaeger, and app services

Key architectural pattern: Single monolithic [src/index.ts](../src/index.ts) (~687 lines) containing all routes, middleware, S3 client, and OpenTelemetry setup.

## Critical Developer Workflows

### Running the Service
```bash
# Development (fast delays 5-15s)
npm run dev

# Production mode (realistic delays 10-120s)
npm run start

# Docker with full stack (MinIO + Jaeger)
npm run docker:dev
```

### Testing
```bash
# E2E tests (spins up server, runs tests, auto-cleanup)
npm run test:e2e
```
E2E runner ([scripts/run-e2e.ts](../scripts/run-e2e.ts)) spawns server, waits for `/health`, executes [scripts/e2e-test.ts](../scripts/e2e-test.ts), then kills server. Tests verify storage health checks and API behavior.

### Manual API Testing
```bash
# Health check (storage connectivity)
curl http://localhost:3000/health

# Fast check endpoint (mock availability)
curl -X POST http://localhost:3000/v1/download/check \
  -H "Content-Type: application/json" \
  -d '{"file_id": 70000}'

# Long-running download (will timeout at 30s by default)
curl -X POST http://localhost:3000/v1/download/start \
  -H "Content-Type: application/json" \
  -d '{"file_id": 70000}'
```

## Project-Specific Conventions

### Environment Configuration
- **Validation**: All env vars validated via Zod schema at startup (lines 20-52 in [src/index.ts](../src/index.ts))
- **Required for S3**: `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET_NAME=downloads`, `S3_FORCE_PATH_STYLE=true`
- **Mock mode**: If `S3_BUCKET_NAME=""`, API runs in mock mode (no actual S3 calls)
- **Delay simulation**: `DOWNLOAD_DELAY_MIN_MS` / `DOWNLOAD_DELAY_MAX_MS` control processing time in `/v1/download/start`

### S3 Integration Pattern
- **Sanitization**: S3 keys sanitized via `sanitizeS3Key()` to prevent path traversal
- **Health checks**: `checkS3Health()` uses HEAD request on `__health_check_marker__` (NotFound = healthy bucket access)
- **Availability**: `checkS3Availability()` checks specific file existence via HeadObjectCommand
- **Bucket**: Must be named `downloads` (hardcoded in init containers)

### Docker Compose Architecture
- **MinIO service** (`delineate-minio`): Ports 9000 (API), 9001 (console)
- **Init container** (`delineate-minio-init`): Creates `downloads` bucket on startup using `mc` client
- **Service naming**: All containers prefixed `delineate-` for namespace isolation
- **Networking**: Custom bridge network `delineate-network` enables service-to-service DNS (e.g., `http://delineate-minio:9000`)
- **Dependencies**: App waits for `delineate-minio-init:service_completed_successfully` to ensure bucket exists

### Middleware Stack (Order Matters)
Applied in [src/index.ts](../src/index.ts) lines 87-135:
1. Request ID injection (x-request-id header)
2. Security headers (`secureHeaders()`)
3. CORS with configurable origins
4. Timeout middleware (`REQUEST_TIMEOUT_MS=30000` default)
5. Rate limiting (IP-based via x-forwarded-for)
6. OpenTelemetry instrumentation
7. Sentry error capture

### OpenAPI & Documentation
- **Scalar docs**: `/docs` endpoint (dev only) - interactive API reference
- **Schema-first**: All routes defined with `createRoute()` + Zod schemas
- **Schema naming**: Schemas use `.openapi()` modifier for proper OpenAPI export (e.g., `DownloadCheckRequestSchema`)

## Integration Points

### External Dependencies
- **Jaeger**: OpenTelemetry traces sent to `http://delineate-jaeger:4318` (OTLP HTTP)
- **Sentry**: Error tracking via `@hono/sentry` middleware (requires `SENTRY_DSN`)
- **MinIO/RustFS**: Self-hosted S3 storage (Challenge 1 requirement)

### Service Communication
- Container-to-container uses Docker service names (e.g., `S3_ENDPOINT=http://delineate-minio:9000`)
- Host-to-container uses `localhost:PORT` (e.g., `http://localhost:9000`)

## Common Pitfalls

### TypeScript Execution
- **No build step**: Uses Node.js 24's native TypeScript support via `--experimental-transform-types`
- **Not a transpiler**: Doesn't support TypeScript features requiring type erasure (enums, namespaces, decorators)
- **Watch mode**: `npm run dev` uses `--watch` flag for auto-reload

### S3 Configuration
- **forcePathStyle**: Must be `true` for MinIO/RustFS (virtual-hosted-style URLs don't work with self-hosted S3)
- **Endpoint URL**: Must include protocol (`http://` or `https://`)
- **Credentials**: MinIO defaults to `minioadmin:minioadmin` (change in production)

### Timeout Behavior
- **Request timeout**: Enforced at 30s via Hono middleware
- **Download delays**: Randomized between 10-120s in production mode (demonstrates timeout problem)
- **E2E tests**: Run with short delays to prevent CI timeouts

### Health Check Logic
- **503 vs 200**: Returns 503 when storage unhealthy (not 500) - server is running but dependencies failed
- **Mock mode**: Always returns 200 when `S3_BUCKET_NAME=""` (no storage required)

## Hackathon Context

### Challenge 1: S3 Storage Integration
Participants modify [docker/compose.dev.yml](../docker/compose.dev.yml) to add MinIO/RustFS service, configure environment variables, and ensure `/health` returns `{"status":"healthy","checks":{"storage":"ok"}}`.

### Challenge 2: Architecture Design
Document solutions for handling long-running downloads (polling, websockets, webhooks) to avoid proxy timeouts. Current `/v1/download/start` endpoint is intentionally broken for >30s operations.

### Challenge 3: CI/CD Pipeline
Extend [.github/workflows/ci.yml](../.github/workflows/ci.yml) with deployment stages.

### Challenge 4: Observability (Bonus)
Implement metrics, structured logging, or enhanced tracing beyond existing Jaeger setup.

## Key Files Reference
- [src/index.ts](../src/index.ts) - Single-file application (all routes, middleware, S3 client)
- [docker/compose.dev.yml](../docker/compose.dev.yml) - Full development stack with MinIO + Jaeger
- [scripts/e2e-test.ts](../scripts/e2e-test.ts) - Test assertions and validation logic
- [scripts/run-e2e.ts](../scripts/run-e2e.ts) - Test orchestration (server lifecycle management)
- [.env.example](../.env.example) - Complete environment variable documentation

## When Modifying Code

### Adding Routes
- Use `createRoute()` with full OpenAPI schema definitions
- Register with `app.openapi(route, handler)`
- Add request validation via Zod schemas
- Include error response schemas (400, 500)

### Environment Variables
- Add to `EnvSchema` (lines 20-52 in [src/index.ts](../src/index.ts))
- Update [.env.example](../.env.example)
- Document in README.md if user-facing

### Docker Changes
- Test with `npm run docker:dev` (builds and runs full stack)
- Verify health checks work: `curl http://localhost:3000/health`
- Check service logs: `docker logs delineate-app`

### CI Pipeline
- All tests run in Node 24 containers (GitHub Actions)
- E2E tests use mock S3 mode (empty `S3_BUCKET_NAME`)
- Docker build cached via GitHub Actions cache
