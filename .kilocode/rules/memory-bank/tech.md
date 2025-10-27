# TurnoPlus Technology Stack

## Backend Technologies

### Core Framework
- **FastAPI 0.115.0+**: Modern, fast web framework for building APIs with Python
  - High performance async support
  - Automatic API documentation with OpenAPI/Swagger
  - Type hints for validation and serialization
  - Built-in data validation with Pydantic

### Programming Language
- **Python 3.13+**: Latest Python version with enhanced features
  - Improved performance and syntax
  - Better type hinting support
  - Enhanced error handling

### Database & ORM
- **MySQL**: Primary database for production
  - Reliable relational database
  - ACID compliance for data integrity
  - Strong community support
- **SQLAlchemy 2.0.35+**: Python SQL toolkit and ORM
  - Modern async support
  - Declarative model definitions
  - Database-agnostic interface
  - Connection pooling and management
- **PyMySQL 1.1.1+**: Pure Python MySQL driver
  - Compatible with SQLAlchemy
  - SSL/TLS support for secure connections

### Database Migration
- **Alembic 1.13.1+**: Database migration tool for SQLAlchemy
  - Version control for database schema
  - Auto-generation of migration scripts
  - Branching and merging support

### Authentication & Security
- **JWT (JSON Web Tokens)**: Stateless authentication
  - Secure token-based authentication
  - Role-based access control
  - Token expiration and refresh
- **Custom Security Implementation**: Salted SHA-256 password hashing
  - Secure password storage
  - Salt generation for rainbow table protection
  - Constant-time comparison for timing attack prevention

### API Documentation
- **OpenAPI/Swagger**: Automatic API documentation
  - Interactive API explorer
  - Schema validation
  - Client SDK generation

### Package Management
- **uv**: Modern Python package manager
  - Fast dependency resolution
  - Virtual environment management
  - Lock file support for reproducible builds

### Development Server
- **Uvicorn 0.30.0+**: ASGI server for FastAPI
  - High performance async server
  - Hot reload for development
  - WebSocket support

### Configuration Management
- **python-dotenv 1.0.1+**: Environment variable management
  - .env file support
  - Environment-specific configuration
  - Secret management

## Frontend Technologies

### Core Framework
- **Angular 20.3.0+**: Modern frontend framework
  - Standalone components (no NgModules required)
  - Improved performance with signals
  - Enhanced developer experience
  - TypeScript-first approach

### Programming Language
- **TypeScript 5.9.2+**: Strongly-typed superset of JavaScript
  - Static type checking
  - Enhanced IDE support
  - Better code maintainability
  - Advanced language features

### UI Framework
- **Angular Material 20.2.9+**: UI component library
  - Material Design components
  - Responsive design patterns
  - Accessibility support (WCAG compliance)
  - Theming and customization
- **Angular CDK 20.2.9+**: Component Development Kit
  - Building blocks for custom components
  - Accessibility utilities
  - Drag and drop, virtual scrolling, etc.

### Reactive Programming
- **RxJS 7.8.0+**: Reactive Extensions for JavaScript
  - Observable patterns for async operations
  - Operators for data transformation
  - Error handling and retry mechanisms
  - Integration with Angular HTTP client

### HTTP Client
- **Angular HttpClient**: Built-in HTTP client
  - Typed responses with TypeScript
  - Request/response interceptors
  - Error handling
  - JSON parsing and serialization

### Routing
- **Angular Router**: Client-side routing
  - Lazy loading of modules
  - Route guards for protection
  - Nested routes and parameters
  - Route data and resolvers

### Testing Framework
- **Jasmine 5.9.0+**: Behavior-driven testing framework
  - Test doubles and spies
  - Matchers and assertions
  - Async testing support
- **Karma 6.4.0+**: Test runner
  - Browser-based test execution
  - Cross-browser testing
  - Coverage reporting
- **Karma-Jasmine-HTML-Reporter**: HTML test reports
- **Karma-Coverage**: Code coverage reporting

### Code Quality
- **ESLint 9.37.0+**: JavaScript/TypeScript linting
  - Code quality and consistency
  - Custom rule configuration
  - IDE integration
- **Angular ESLint 20.4.0+**: Angular-specific linting rules
- **Prettier 3.6.2+**: Code formatting
  - Consistent code style
  - Integration with ESLint
  - Editor integration

### Build Tools
- **Angular CLI 20.3.5+**: Command-line interface for Angular
  - Project scaffolding
  - Build optimization
  - Development server
  - Testing and deployment
- **Angular Build 20.3.5+**: Optimized build system
  - Tree shaking
  - Code splitting
  - Bundle optimization
  - AOT compilation

## Development Environment

### Version Control
- **Git**: Distributed version control system
- **Git Ignore**: Configured for Python, Node.js, and IDE files

### Code Editor Configuration
- **EditorConfig**: Consistent editor configuration
  - Indentation styles
  - Line endings
  - Character encoding
- **VS Code Settings**: Recommended extensions and settings

### Environment Configuration
- **Environment Variables**: Configuration for different environments
  - Development, staging, production
  - Database connections
  - API endpoints
  - Security settings

## Development Workflow

### Backend Development
```bash
# Development server
cd backend
uv run uvicorn main:app --reload --port 8000

# Database migrations
uv run alembic upgrade head
uv run alembic revision --autogenerate -m "description"

# Testing
uv run pytest
```

### Frontend Development
```bash
# Development server
cd frontend
npm start

# Building for production
npm run build

# Testing
npm test

# Linting
npm run lint
```

## Deployment Technologies

### Backend Deployment
- **Docker**: Containerization for consistent deployment
- **Gunicorn**: Production WSGI server (alternative to Uvicorn)
- **Nginx**: Reverse proxy and static file serving
- **Environment Variables**: Configuration management

### Frontend Deployment
- **Static File Hosting**: Nginx, Apache, or CDN
- **Progressive Web App**: PWA capabilities for mobile
- **Browser Caching**: Optimized cache headers
- **Content Delivery Network**: Global asset distribution

## Monitoring and Observability

### Logging
- **Python Logging**: Structured logging for backend
- **Browser Console**: Frontend debugging and logging

### Health Checks
- **FastAPI Health Endpoint**: `/healthz` endpoint for monitoring
- **Database Connectivity**: Connection health verification

## Security Considerations

### Backend Security
- **CORS Configuration**: Cross-origin resource sharing setup
- **Input Validation**: Pydantic schemas for data validation
- **SQL Injection Prevention**: ORM-based database access
- **Password Security**: Salted hashing with SHA-256

### Frontend Security
- **XSS Prevention**: Angular's built-in XSS protection
- **CSRF Protection**: Token-based CSRF protection
- **Content Security Policy**: CSP header configuration
- **Secure Storage**: Local storage for authentication tokens

## Performance Optimization

### Backend Performance
- **Async Operations**: Non-blocking I/O with FastAPI
- **Database Optimization**: Connection pooling and query optimization
- **Caching Strategy**: In-memory caching for frequently accessed data
- **Response Compression**: Gzip compression for API responses

### Frontend Performance
- **Lazy Loading**: On-demand module loading
- **Bundle Optimization**: Code splitting and tree shaking
- **Change Detection**: Optimized Angular change detection
- **Image Optimization**: Responsive images and modern formats