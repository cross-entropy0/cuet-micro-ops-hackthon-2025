# VM Deployment Guide

## Quick Start Deployment

### 1. Copy Environment File
```bash
# On your VM
cp .env.production .env

# Replace <VM_IP> with your actual VM IP (e.g., 36.255.70.210)
sed -i 's/<VM_IP>/YOUR_VM_IP_HERE/g' .env
```

### 2. Build and Start Services
```bash
docker-compose -f docker/compose.prod.yml up -d --build
```

### 3. Access Services
- **Frontend**: http://YOUR_VM_IP
- **Backend API**: http://YOUR_VM_IP:3000
- **Jaeger UI**: http://YOUR_VM_IP:16686
- **MinIO Console**: http://YOUR_VM_IP:9001

---

## What's Deployed

### Services
1. **delineate-app** - Backend API (Node.js + Hono)
2. **frontend** - React app (nginx)
3. **delineate-jaeger** - Trace collection and visualization
4. **delineate-minio** - S3-compatible object storage

### Ports
- `80` → Frontend (nginx)
- `3000` → Backend API
- `4318` → OTLP trace collector (Jaeger)
- `16686` → Jaeger UI
- `9000` → MinIO API
- `9001` → MinIO Console

---

## Observability Features

### ✅ Sentry Integration
- **Error Boundary**: Wraps entire React app
- **API Error Capture**: Automatic tracking of failed API calls
- **User Feedback**: Dialog for error reporting
- **Performance Monitoring**: Page load tracking
- **Custom Error Logging**: Business logic errors

**Setup**:
1. Create Sentry projects (one for frontend, one for backend)
2. Add DSNs to `.env`:
   ```bash
   SENTRY_DSN=https://...@sentry.io/backend-project
   VITE_SENTRY_DSN=https://...@sentry.io/frontend-project
   ```

### ✅ OpenTelemetry Integration
- **W3C Trace Context**: `traceparent` header propagation
- **End-to-End Tracing**: Frontend → Backend correlation
- **Custom Spans**: User interaction tracking
- **Jaeger UI**: Visual trace exploration

**Trace Flow**:
```
User clicks button
  → Frontend creates span (trace-id: abc123)
  → HTTP request with traceparent: 00-abc123-...
  → Backend continues trace (same trace-id)
  → All spans visible in Jaeger UI
```

---

## Testing the Deployment

### 1. Health Check
```bash
curl http://YOUR_VM_IP:3000/health
# Expected: {"status":"healthy","checks":{"storage":"ok"}}
```

### 2. Frontend Access
```bash
curl http://YOUR_VM_IP
# Should return HTML
```

### 3. Trace Propagation Test
1. Open frontend: http://YOUR_VM_IP
2. Click "Check Health Status" button
3. Open browser DevTools → Network tab
4. Look for `traceparent` header in request headers
5. Copy trace ID from UI (bottom right corner)
6. Open Jaeger: http://YOUR_VM_IP:16686/trace/{TRACE_ID}
7. Verify you see both frontend and backend spans

### 4. Error Tracking Test
1. Go to "Error Monitoring" tab
2. Click "Trigger Backend Error" or "Trigger Frontend Error"
3. Check Sentry dashboard for captured errors

---

## Monitoring

### View Logs
```bash
# All services
docker-compose -f docker/compose.prod.yml logs -f

# Specific service
docker-compose -f docker/compose.prod.yml logs -f delineate-app
docker-compose -f docker/compose.prod.yml logs -f frontend
```

### Service Status
```bash
docker-compose -f docker/compose.prod.yml ps
```

### Restart Services
```bash
# Restart all
docker-compose -f docker/compose.prod.yml restart

# Restart specific service
docker-compose -f docker/compose.prod.yml restart delineate-app
```

---

## Troubleshooting

### CORS Errors
**Symptom**: Frontend can't connect to backend  
**Solution**: Verify `CORS_ORIGINS` in `.env` includes your VM IP:
```bash
CORS_ORIGINS=http://YOUR_VM_IP,http://YOUR_VM_IP:80
```

### Trace Not Appearing in Jaeger
**Symptom**: No traces in Jaeger UI  
**Solutions**:
1. Check OTEL exporter URL: `VITE_OTEL_EXPORTER_URL=http://YOUR_VM_IP:4318/v1/traces`
2. Verify Jaeger is running: `docker-compose -f docker/compose.prod.yml ps delineate-jaeger`
3. Check browser console for OTEL errors

### Build Fails
**Symptom**: `docker-compose up --build` fails  
**Solution**: Check build args are passed correctly:
```bash
# Verify .env file has all required variables
cat .env | grep VITE_
```

### Frontend Shows Blank Page
**Solutions**:
1. Check nginx logs: `docker-compose -f docker/compose.prod.yml logs frontend`
2. Verify build completed: `docker-compose -f docker/compose.prod.yml exec frontend ls /usr/share/nginx/html`
3. Check browser console for errors

---

## Security Notes

⚠️ **Before Production**:
1. Change MinIO credentials (default: minioadmin/minioadmin)
2. Set up HTTPS with Let's Encrypt
3. Configure firewall rules (allow only 80, 443, 22)
4. Use secrets management for Sentry DSNs
5. Enable authentication for Jaeger UI

---

## Clean Up

```bash
# Stop all services
docker-compose -f docker/compose.prod.yml down

# Remove volumes (WARNING: deletes all data)
docker-compose -f docker/compose.prod.yml down -v

# Remove images
docker-compose -f docker/compose.prod.yml down --rmi all
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ VM (YOUR_VM_IP)                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌─────────────┐  │
│  │   Frontend   │───▶│  Backend API │───▶│   MinIO     │  │
│  │   (nginx)    │    │   (Node.js)  │    │   (S3)      │  │
│  │   Port 80    │    │   Port 3000  │    │ Port 9000/1 │  │
│  └──────┬───────┘    └──────┬───────┘    └─────────────┘  │
│         │                   │                              │
│         │ traceparent       │ OTLP traces                  │
│         │ header            │                              │
│         ▼                   ▼                              │
│  ┌────────────────────────────────────────────────────┐   │
│  │          Jaeger (Trace Collection)                 │   │
│  │          Ports 4318 (OTLP), 16686 (UI)             │   │
│  └────────────────────────────────────────────────────┘   │
│                                                             │
│  External Services:                                         │
│  • Sentry.io (Error Tracking)                              │
│  • Errors/Performance data sent from both frontend/backend │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Summary

✅ **All Observability Requirements Met**:
- Sentry: Error tracking, user feedback, performance monitoring
- OpenTelemetry: W3C trace propagation, end-to-end tracing
- Dashboard: Health status, metrics, error log, trace viewer
- Jaeger UI: Visual trace exploration

✅ **Production Ready**:
- Multi-stage Docker builds
- nginx for frontend serving
- Environment-based configuration
- Auto-restart policies
- Proper logging

🚀 **Deploy to VM in 3 commands**:
```bash
cp .env.production .env
sed -i 's/<VM_IP>/36.255.70.210/g' .env
docker-compose -f docker/compose.prod.yml up -d --build
```
