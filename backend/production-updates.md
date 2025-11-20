# Production Configuration Updates for TurnoPlus Backend

## Required Changes for Production Deployment

### 1. Update `src/app/main.py` for Production

The current main.py file needs several updates for production deployment:

#### Current Issues:
1. Hardcoded localhost origins in CORS configuration
2. No production environment detection
3. Missing production logging configuration
4. No graceful shutdown handling

#### Required Changes:

```python
# Add these imports at the top
import logging
import os
from contextlib import asynccontextmanager

# Add environment-based configuration
def get_cors_origins():
    """Get CORS origins based on environment"""
    env = os.getenv("ENVIRONMENT", "development")
    
    if env == "production":
        # Production frontend URL
        return ["https://your-production-frontend.com"]
    elif env == "staging":
        # Staging frontend URL
        return ["https://your-staging-frontend.com"]
    else:
        # Development origins
        return [
            "http://localhost:4200",  # Angular dev server
            "http://localhost:3000",  # React dev server (if needed)
            "http://127.0.0.1:4200",
            "http://127.0.0.1:3000",
        ]

def get_log_level():
    """Get log level based on environment"""
    env = os.getenv("ENVIRONMENT", "development")
    return logging.INFO if env == "production" else logging.DEBUG

# Add lifecycle management
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle"""
    # Startup
    logger.info("Starting TurnoPlus API...")
    yield
    # Shutdown
    logger.info("Shutting down TurnoPlus API...")

# Update create_app function
def create_app() -> FastAPI:
    """Create and configure FastAPI application"""
    
    # Configure logging
    logging.basicConfig(
        level=get_log_level(),
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    
    app = FastAPI(
        title="TurnoPlus API",
        description="Medical appointment management system API",
        version="1.0.0",
        lifespan=lifespan,
        docs_url="/docs" if os.getenv("ENVIRONMENT") != "production" else None,
        redoc_url="/redoc" if os.getenv("ENVIRONMENT") != "production" else None,
    )
    
    # CORS middleware with environment-based origins
    app.add_middleware(
        CORSMiddleware,
        allow_origins=get_cors_origins(),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # ... rest of the function remains the same
```

### 2. Update `.env.example` for Production

```bash
# Environment
ENVIRONMENT=development

# Database Configuration
DATABASE_URL=mysql+pymysql://turnoplus_user:password@localhost:3306/turnoplus
DATABASE_ECHO=false
DATABASE_POOL_PRE_PING=true
DATABASE_POOL_SIZE=10
DATABASE_MAX_OVERFLOW=20

# Security Configuration
JWT_SECRET_KEY=your-super-secret-jwt-key-change-this-in-production
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS Configuration
CORS_ORIGINS=http://localhost:4200,http://localhost:3000

# Application Configuration
PYTHONPATH=/app
PYTHONDONTWRITEBYTECODE=1
PYTHONUNBUFFERED=1

# Logging Configuration
LOG_LEVEL=INFO

# Render-specific (will be set automatically)
# PORT=8000
# RENDER_EXTERNAL_URL=https://your-app.onrender.com
# RENDER_EXTERNAL_HOSTNAME=your-app.onrender.com
```

### 3. Create Production Database Migration Script

```python
# scripts/migrate_production.py
"""Production database migration script"""
import asyncio
import os
from sqlalchemy import create_engine, text
from src.app.db.settings import get_database_url

async def run_migrations():
    """Run database migrations for production"""
    engine = create_engine(get_database_url())
    
    with engine.connect() as conn:
        # Check if database exists
        result = conn.execute(text("SHOW DATABASES LIKE 'turnoplus'"))
        if not result.fetchone():
            conn.execute(text("CREATE DATABASE turnoplus"))
            print("Database 'turnoplus' created")
        
        # Run Alembic migrations
        os.system("alembic upgrade head")
        print("Migrations completed")

if __name__ == "__main__":
    asyncio.run(run_migrations())
```

### 4. Add Production Health Check Enhancements

```python
# src/app/routes/v1/health.py (new file)
from fastapi import APIRouter, Depends
from sqlalchemy import text
from src.app.db.broker import DBBroker
from src.app.db.settings import get_database_url

router = APIRouter()

@router.get("/healthz")
async def health_check():
    """Comprehensive health check endpoint"""
    try:
        # Check database connection
        db_broker = DBBroker()
        with db_broker.get_session() as session:
            result = session.execute(text("SELECT 1"))
            db_status = "healthy" if result.fetchone() else "unhealthy"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
    
    return {
        "status": "healthy",
        "database": db_status,
        "environment": os.getenv("ENVIRONMENT", "development"),
        "version": "1.0.0"
    }

@router.get("/ready")
async def readiness_check():
    """Readiness check for Kubernetes/Render"""
    # Check if all critical services are ready
    try:
        db_broker = DBBroker()
        with db_broker.get_session() as session:
            session.execute(text("SELECT 1"))
        return {"status": "ready"}
    except Exception:
        return {"status": "not_ready"}, 503
```

### 5. Update Production Requirements

```toml
# Add to pyproject.toml dependencies section
[project.dependencies]
# ... existing dependencies ...

# Production-specific dependencies
gunicorn = ">=21.0.0"
psycopg2-binary = {version = ">=2.9.0", optional = true}  # For PostgreSQL if needed
redis = {version = ">=5.0.0", optional = true}  # For caching if needed

# Development dependencies
[project.optional-dependencies]
dev = [
    "pytest>=7.0.0",
    "pytest-asyncio>=0.21.0",
    "black>=23.0.0",
    "isort>=5.12.0",
    "mypy>=1.0.0",
]
```

### 6. Create Production Start Script

```bash
# scripts/start_production.sh
#!/bin/bash
set -e

echo "Starting TurnoPlus API in production mode..."

# Set production environment
export ENVIRONMENT=production

# Run database migrations
echo "Running database migrations..."
alembic upgrade head

# Start the application with Gunicorn
exec gunicorn src.app.main:app \
    --bind 0.0.0.0:$PORT \
    --workers 4 \
    --worker-class uvicorn.workers.UvicornWorker \
    --access-logfile - \
    --error-logfile - \
    --log-level info \
    --timeout 120 \
    --keep-alive 2 \
    --max-requests 1000 \
    --max-requests-jitter 100
```

## Implementation Priority

### High Priority (Must Have)
1. ✅ Update CORS configuration for production
2. ✅ Add environment-based configuration
3. ✅ Create production health checks
4. ✅ Update environment variables template

### Medium Priority (Should Have)
1. 🔄 Add production logging configuration
2. 🔄 Create database migration script
3. 🔄 Add graceful shutdown handling
4. 🔄 Create production start script

### Low Priority (Nice to Have)
1. 📝 Add performance monitoring
2. 📝 Add error tracking (Sentry)
3. 📝 Add caching layer
4. 📝 Add API rate limiting

## Testing Strategy

### Pre-deployment Tests
1. **Environment Configuration**: Test with production environment variables
2. **Database Connection**: Verify MySQL connection with production URL
3. **CORS Configuration**: Test with production frontend URL
4. **Health Checks**: Verify all health endpoints work correctly

### Post-deployment Tests
1. **API Functionality**: Test all endpoints with production URL
2. **Authentication**: Verify JWT authentication works
3. **Database Operations**: Test CRUD operations
4. **Performance**: Monitor response times and error rates

## Security Considerations

### Environment Variables
- Never commit secrets to version control
- Use Render's environment variable management
- Rotate secrets regularly
- Use strong JWT secret keys

### Database Security
- Use SSL connections for MySQL
- Implement connection pooling
- Limit database user permissions
- Regular database backups

### API Security
- Enable HTTPS (Render provides this)
- Implement rate limiting
- Add request validation
- Monitor for suspicious activity

## Monitoring and Logging

### Application Metrics
- Response times
- Error rates
- Request counts
- Database query performance

### Health Monitoring
- Database connectivity
- Memory usage
- CPU usage
- Disk space

### Logging Strategy
- Structured JSON logs
- Log levels: DEBUG, INFO, WARNING, ERROR
- Centralized log aggregation
- Alert on critical errors