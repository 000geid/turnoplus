# TurnoPlus Technical Architecture

## System Overview

TurnoPlus implements a modern web application architecture with clear separation between frontend and backend components. The system follows a microservices pattern with a RESTful API backend and a single-page application (SPA) frontend.

## Backend Architecture

### Core Framework
- **FastAPI**: High-performance async web framework for Python
- **Python 3.13+**: Latest Python version with enhanced features
- **Hexagonal Architecture**: Clean separation of concerns with controllers, services, and repositories

### Architectural Layers
```
┌─────────────────────────────────────────┐
│              API Routes                  │
│  (FastAPI routers with endpoint definitions) │
├─────────────────────────────────────────┤
│            Controllers                  │
│     (Request handling and validation)   │
├─────────────────────────────────────────┤
│             Services                    │
│      (Business logic implementation)    │
├─────────────────────────────────────────┤
│           Repositories                  │
│       (Data access abstraction)         │
├─────────────────────────────────────────┤
│            Database                     │
│        (SQLAlchemy ORM layer)           │
└─────────────────────────────────────────┘
```

### Key Backend Components

#### API Structure
- **Router Organization**: Feature-based routing in `backend/src/app/routes/v1/`
- **Endpoint Groups**: Users, Patients, Doctors, Admins, Appointments, Medical Records, Offices, Settings
- **Middleware**: CORS configuration for frontend integration
- **Authentication**: JWT-based authentication with role-based access control

#### Data Models
- **SQLAlchemy 2.0.35+**: Modern ORM with async support
- **Base Model**: Common fields (id, created_at, updated_at) in `backend/src/app/db/base.py`
- **Relationships**: Proper foreign key relationships with cascade operations
- **Enums**: Centralized enum definitions for consistent values

#### Database Management
- **Alembic**: Database migration management
- **MySQL**: Primary database with PyMySQL driver
- **Connection Pooling**: Optimized database connections
- **Environment Configuration**: Flexible database settings via environment variables

## Frontend Architecture

### Core Framework
- **Angular 20.3.0+**: Modern frontend framework with standalone components
- **TypeScript**: Strongly-typed JavaScript for better development experience
- **Angular Material 20.2.9+**: UI component library for consistent design
- **RxJS**: Reactive programming for asynchronous operations

### Architectural Patterns
```
┌─────────────────────────────────────────┐
│              Components                 │
│     (UI components with templates)      │
├─────────────────────────────────────────┤
│              Services                   │
│    (Business logic and API calls)       │
├─────────────────────────────────────────┤
│               Guards                    │
│      (Route protection and auth)        │
├─────────────────────────────────────────┤
│            Interceptors                 │
│     (HTTP request/response handling)    │
├─────────────────────────────────────────┤
│              Models                     │
│       (TypeScript interfaces)          │
└─────────────────────────────────────────┘
```

### Key Frontend Components

#### Module Structure
- **Feature Modules**: Separate modules for patient, doctor, and admin functionality
- **Lazy Loading**: On-demand loading of feature modules for better performance
- **Shared Components**: Reusable components across different modules
- **Core Services**: Authentication, HTTP interceptors, and route guards

#### Routing and Navigation
- **Angular Router**: Client-side routing with lazy-loaded modules
- **Route Guards**: Authentication and role-based access control
- **Nested Routes**: Hierarchical routing structure for complex features
- **Route Data**: Metadata for route protection and component configuration

#### State Management
- **Service-based Architecture**: Services manage state and business logic
- **RxJS Observables**: Reactive data streams for asynchronous operations
- **Signals**: Angular's new reactive primitive for local state management
- **Local Storage**: Persistent session data for authentication tokens

## Security Architecture

### Authentication System
- **JWT Tokens**: Stateless authentication with bearer tokens
- **Multi-role Support**: Patient, Doctor, and Admin roles with different permissions
- **Token Refresh**: Secure token renewal mechanism
- **Session Management**: Client-side session storage with automatic cleanup

### Security Measures
- **Password Hashing**: Salted SHA-256 hashing for password storage
- **Input Validation**: Pydantic schemas for backend validation
- **CORS Configuration**: Proper cross-origin resource sharing setup
- **Route Protection**: Client-side and server-side route guards

## Data Flow Architecture

### Request Flow
```
Frontend Component → Service → HTTP Interceptor → API Route → Controller → Service → Repository → Database
```

### Response Flow
```
Database → Repository → Service → Controller → API Route → HTTP Interceptor → Service → Frontend Component
```

### Authentication Flow
1. User submits credentials to login endpoint
2. Backend validates credentials and returns JWT token
3. Frontend stores token in local storage
4. HTTP interceptor automatically includes token in subsequent requests
5. Backend validates token on protected routes

## Integration Architecture

### API Integration
- **RESTful Design**: Standard HTTP methods and status codes
- **JSON Serialization**: Consistent data format for requests and responses
- **Error Handling**: Standardized error response structure
- **API Documentation**: OpenAPI/Swagger documentation for endpoints

### Database Integration
- **ORM Abstraction**: SQLAlchemy provides database-agnostic interface
- **Migration Management**: Alembic tracks and applies schema changes
- **Connection Management**: Connection pooling for optimal performance
- **Transaction Management**: ACID compliance for data integrity

## Deployment Architecture

### Backend Deployment
- **Containerization**: Docker container for consistent deployment
- **Environment Configuration**: Environment-specific settings
- **Process Management**: Gunicorn or uvicorn for production serving
- **Monitoring**: Health checks and logging for operational visibility

### Frontend Deployment
- **Static Assets**: Optimized build output for web serving
- **CDN Integration**: Content delivery network for global performance
- **Browser Caching**: Proper cache headers for optimal loading
- **Progressive Web App**: PWA capabilities for mobile experience

## Performance Considerations

### Backend Optimization
- **Async Operations**: Non-blocking I/O for better concurrency
- **Database Indexing**: Optimized queries with proper indexes
- **Connection Pooling**: Reused database connections for efficiency
- **Caching Strategy**: Redis or in-memory caching for frequently accessed data

### Frontend Optimization
- **Lazy Loading**: On-demand loading of modules and components
- **Bundle Optimization**: Code splitting and tree shaking for smaller bundles
- **Change Detection**: Optimized Angular change detection strategies
- **Image Optimization**: Responsive images and modern formats

## Scalability Architecture

### Horizontal Scaling
- **Stateless Design**: Backend servers can be scaled horizontally
- **Load Balancing**: Multiple backend instances behind a load balancer
- **Database Scaling**: Read replicas and connection pooling
- **CDN Distribution**: Global content delivery for frontend assets

### Vertical Scaling
- **Resource Optimization**: Efficient memory and CPU usage
- **Database Optimization**: Query optimization and proper indexing
- **Caching Layers**: Multiple caching levels for performance
- **Monitoring**: Performance metrics and alerting for proactive scaling