# TurnoPlus Backend Deployment Plan for Render.com

## Overview
This document outlines the complete deployment strategy for the TurnoPlus FastAPI backend to Render.com.

## Current State Analysis
- **Framework**: FastAPI 0.115.0+ with Python 3.13+
- **Database**: MySQL with SQLAlchemy 2.0.35+
- **Package Manager**: `uv` with `pyproject.toml`
- **Current Status**: No deployment configuration exists

## Required Deployment Files

### 1. Dockerfile
```dockerfile
# Use Python 3.13 slim image for smaller size
FROM python:3.13-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Install uv package manager
RUN pip install uv

# Copy dependency files
COPY pyproject.toml ./
COPY uv.lock ./

# Install dependencies
RUN uv pip install --system -r pyproject.toml

# Copy application code
COPY . .

# Create non-root user for security
RUN useradd --create-home --shell /bin/bash appuser
RUN chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/healthz || exit 1

# Start command (Render will override this, but keep as fallback)
CMD ["gunicorn", "src.app.main:app", "--bind", "0.0.0.0:8000", "--workers", "4", "--worker-class", "uvicorn.workers.UvicornWorker"]
```

### 2. runtime.txt
```txt
python-3.13
```

### 3. render.yaml
```yaml
services:
  # Web Service Configuration
  - type: web
    name: turnoplus-backend
    env: python
    plan: free
    buildCommand: pip install uv && uv pip install --system -r pyproject.toml
    startCommand: gunicorn src.app.main:app --bind 0.0.0.0:$PORT --workers 4 --worker-class uvicorn.workers.UvicornWorker
    healthCheckPath: /healthz
    healthCheckTimeout: 30
    healthCheckInterval: 10
    autoDeploy: true
    
    # Environment Variables
    envVars:
      - key: DATABASE_URL
        sync: false
      - key: DATABASE_ECHO
        sync: false
      - key: DATABASE_POOL_PRE_PING
        sync: false
      - key: PYTHONPATH
        value: /app
      - key: PYTHONDONTWRITEBYTECODE
        value: "1"
      - key: PYTHONUNBUFFERED
        value: "1"

  # Database Service (Optional - can use managed MySQL instead)
  # - type: pserv
  #   name: turnoplus-db
  #   plan: free
  #   region: oregon
  #   databaseName: turnoplus
  #   databaseUser: turnoplus_user
  #   envVars:
  #     - key: DATABASE_URL
  #       value: mysql+pymysql://turnoplus_user:password@turnoplus-db:3306/turnoplus

# Build Configuration
build:
  # Use Dockerfile build
  dockerfilePath: ./Dockerfile
  
  # Build context
  dockerContext: .
  
  # Build arguments (if needed)
  # buildArgs:
  #   - key: NODE_ENV
  #     value: production

# Environment Groups (for different environments)
environments:
  # Production Environment
  production:
    envVars:
      - key: DATABASE_URL
        sync: false
      - key: CORS_ORIGINS
        value: https://your-frontend-domain.com
      - key: DEBUG
        value: "false"
      - key: LOG_LEVEL
        value: "INFO"
        
  # Development/Staging Environment
  development:
    envVars:
      - key: DATABASE_URL
        sync: false
      - key: CORS_ORIGINS
        value: http://localhost:4200,http://localhost:3000
      - key: DEBUG
        value: "true"
      - key: LOG_LEVEL
        value: "DEBUG"
```

### 4. Production Environment Variables
```bash
# Database Configuration
DATABASE_URL=mysql+pymysql://username:password@render-mysql-host:3306/turnoplus
DATABASE_ECHO=0
DATABASE_POOL_PRE_PING=1

# Application Configuration
PYTHONPATH=/app
PYTHONDONTWRITEBYTECODE=1
PYTHONUNBUFFERED=1

# Security & CORS
CORS_ORIGINS=https://your-production-frontend.com
DEBUG=false
LOG_LEVEL=INFO

# JWT Configuration
JWT_SECRET_KEY=your-super-secret-jwt-key-here
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

# Optional: Render-specific
# RENDER_EXTERNAL_URL=https://your-app.onrender.com
# RENDER_EXTERNAL_HOSTNAME=your-app.onrender.com
```

## Deployment Strategy

### Phase 1: File Creation
1. Create `Dockerfile` with multi-stage build optimization
2. Create `runtime.txt` specifying Python 3.13
3. Create `render.yaml` with service configuration
4. Update `.env.example` with production template

### Phase 2: Configuration Updates
1. Update `src/app/main.py` for production CORS
2. Configure database connection for production
3. Add production logging configuration
4. Set up health check endpoints

### Phase 3: Testing & Deployment
1. Local Docker build test
2. Push to repository
3. Connect Render to repository
4. Deploy using Render CLI or web dashboard
5. Verify API functionality

### Phase 4: Post-Deployment
1. Monitor application logs
2. Test API endpoints
3. Verify database connectivity
4. Update frontend CORS configuration
5. Document deployment URLs and credentials

## Production Considerations

### Security
- Use Render's managed MySQL service for better security
- Configure proper CORS origins for production frontend
- Use environment variables for all sensitive data
- Enable SSL (Render provides this automatically)

### Performance
- Use Gunicorn with multiple workers
- Enable connection pooling for database
- Configure proper timeouts and retries
- Monitor resource usage

### Monitoring
- Render provides built-in metrics
- Set up health check endpoints
- Configure logging for production
- Set up alerts for critical errors

## Render CLI Commands

```bash
# Install Render CLI
npm i -g @render/cli

# Login to Render
render login

# Deploy the service
render deploy

# Check deployment status
render ps

# View logs
render logs --service turnoplus-backend
```

## Troubleshooting

### Common Issues
1. **Database Connection**: Ensure DATABASE_URL is correctly formatted
2. **CORS Errors**: Verify frontend URL is in allowed origins
3. **Build Failures**: Check pyproject.toml dependencies
4. **Memory Issues**: Adjust Gunicorn worker count
5. **Timeout Errors**: Increase health check timeouts

### Debug Commands
```bash
# Check build logs
render logs --service turnoplus-backend --build

# Check runtime logs
render logs --service turnoplus-backend

# Access service shell
render shell turnoplus-backend

# Restart service
render restart turnoplus-backend
```

## Next Steps

1. **Immediate**: Create the deployment files listed above
2. **Testing**: Build and test Docker image locally
3. **Deployment**: Deploy to Render using CLI
4. **Verification**: Test all API endpoints
5. **Documentation**: Update project README with deployment instructions

## Files to Create Summary

- ✅ `backend/Dockerfile` - Container configuration
- ✅ `backend/runtime.txt` - Python runtime specification  
- ✅ `backend/render.yaml` - Render service configuration
- 🔄 Update `backend/src/app/main.py` - Production CORS settings
- 🔄 Update `backend/.env.example` - Production environment template
- 📝 `backend/deployment-guide.md` - This documentation file