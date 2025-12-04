# Architecture Documentation

## System Overview

Secure Task Manager is a cloud-native, microservices-based application demonstrating enterprise-level architecture patterns, DevSecOps practices, and modern web development.

---

## High-Level Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│                         GitHub Repository                        │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   GitHub Actions CI/CD                    │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │  │
│  │  │   Dev    │  │ Staging  │  │   Prod   │  │ Security │ │  │
│  │  │ Pipeline │  │ Pipeline │  │ Pipeline │  │ Scanning │ │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Deploy
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Docker Host / Cloud                         │
│                                                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  React Frontend │  │   .NET API      │  │   PostgreSQL    │ │
│  │   (Container)   │  │  (Container)    │  │   (Container)   │ │
│  │                 │  │                 │  │                 │ │
│  │  - React 18     │  │  - .NET 8.0     │  │  - PostgreSQL   │ │
│  │  - Nginx        │  │  - EF Core      │  │    16           │ │
│  │  - Port 3000    │  │  - JWT Auth     │  │  - Port 5432    │ │
│  │                 │  │  - Port 5000    │  │                 │ │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘ │
│           │                    │                     │          │
│           └────────────────────┴─────────────────────┘          │
│                      Docker Network: app-network                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Architecture Layers

### 1. Presentation Layer (Frontend)

**Technology:** React 18 + Modern CSS

**Components:**
- `App.js` - Main application component with authentication state
- `Login.js` - Authentication UI (login/register)
- `TaskList.js` - Task display and management
- `TaskForm.js` - Task creation/editing modal
- `api.js` - HTTP client service

**Responsibilities:**
- User interface rendering
- User input handling
- API communication
- Client-side state management
- Authentication token storage (localStorage)

**Design Patterns:**
- Component-based architecture
- Hooks for state management (useState, useEffect, useCallback)
- Service layer for API calls
- Responsive design principles

---

### 2. Application Layer (API)

**Technology:** .NET 8.0 Web API

**Structure:**
```
SecureTaskManager.API/
├── Controllers/
│   ├── AuthController.cs      # Authentication endpoints
│   ├── TasksController.cs     # Task CRUD operations
│   └── HealthController.cs    # Health check endpoint
├── Models/
│   ├── User.cs               # User entity
│   ├── TaskItem.cs           # Task entity
│   ├── LoginRequest.cs       # DTOs
│   └── RegisterRequest.cs
├── Data/
│   └── ApplicationDbContext.cs  # EF Core DbContext
├── Middleware/
│   ├── RateLimitingMiddleware.cs
│   └── SecurityHeadersMiddleware.cs
└── Program.cs                # Application configuration
```

**Responsibilities:**
- Request handling and routing
- Business logic execution
- Data validation
- Authentication and authorization
- Database operations via ORM
- Error handling and logging

**Design Patterns:**
- RESTful API design
- Repository pattern (via EF Core)
- Dependency injection
- Middleware pipeline
- DTO (Data Transfer Objects)

---

### 3. Data Layer

**Technology:** PostgreSQL 16 + Entity Framework Core

**Database Schema:**
```sql
-- Users Table
CREATE TABLE Users (
    Id SERIAL PRIMARY KEY,
    Username VARCHAR(255) UNIQUE NOT NULL,
    Email VARCHAR(255) UNIQUE NOT NULL,
    PasswordHash TEXT NOT NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tasks Table
CREATE TABLE Tasks (
    Id SERIAL PRIMARY KEY,
    Title VARCHAR(500) NOT NULL,
    Description TEXT,
    IsCompleted BOOLEAN DEFAULT FALSE,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CompletedAt TIMESTAMP,
    UserId INTEGER REFERENCES Users(Id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_tasks_userid ON Tasks(UserId);
CREATE INDEX idx_users_username ON Users(Username);
CREATE INDEX idx_users_email ON Users(Email);
```

**Entity Relationships:**
```
┌─────────────┐          ┌─────────────┐
│    User     │          │    Task     │
├─────────────┤          ├─────────────┤
│ Id (PK)     │─────────<│ Id (PK)     │
│ Username    │   1:N    │ Title       │
│ Email       │          │ Description │
│ PasswordHash│          │ IsCompleted │
│ CreatedAt   │          │ CreatedAt   │
└─────────────┘          │ CompletedAt │
                         │ UserId (FK) │
                         └─────────────┘
```

---

## Security Architecture

### Authentication Flow
```
┌──────────┐                ┌──────────┐                ┌──────────┐
│  Client  │                │   API    │                │ Database │
└────┬─────┘                └────┬─────┘                └────┬─────┘
     │                           │                           │
     │  POST /auth/login         │                           │
     │──────────────────────────>│                           │
     │  {username, password}     │                           │
     │                           │  Query user               │
     │                           │─────────────────────────>│
     │                           │                           │
     │                           │  User data                │
     │                           │<─────────────────────────│
     │                           │                           │
     │                           │  Verify password (BCrypt)│
     │                           │                           │
     │                           │  Generate JWT token       │
     │                           │                           │
     │  200 OK                   │                           │
     │  {token, user}            │                           │
     │<──────────────────────────│                           │
     │                           │                           │
     │  Store token in           │                           │
     │  localStorage             │                           │
     │                           │                           │
     │  GET /tasks               │                           │
     │  Authorization: Bearer... │                           │
     │──────────────────────────>│                           │
     │                           │  Validate JWT             │
     │                           │                           │
     │                           │  Query tasks              │
     │                           │─────────────────────────>│
     │                           │                           │
     │  200 OK                   │  Tasks                    │
     │  [tasks]                  │<─────────────────────────│
     │<──────────────────────────│                           │
```

### Security Layers

1. **Network Security**
   - HTTPS/TLS encryption
   - CORS policy
   - Security headers

2. **Application Security**
   - JWT authentication
   - BCrypt password hashing
   - Input validation
   - SQL injection prevention

3. **Container Security**
   - Non-root users
   - Minimal base images
   - Image scanning (Trivy)

4. **Pipeline Security**
   - Secret scanning (GitLeaks)
   - Dependency scanning (Snyk)
   - Code quality (SonarCloud)

---

## DevOps Architecture

### CI/CD Pipeline Flow
```
┌────────────────────────────────────────────────────────────────┐
│                         Developer                              │
│                       git push code                            │
└───────────────────────────┬────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────────┐
│                      GitHub Actions                            │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Stage 1: Build & Test                                   │ │
│  │  - Checkout code                                         │ │
│  │  - Setup .NET 8.0 & Node.js 18                          │ │
│  │  - Restore dependencies                                  │ │
│  │  - Build API & Frontend                                  │ │
│  │  - Run unit tests                                        │ │
│  └──────────────────────────────────────────────────────────┘ │
│                            │                                    │
│                            ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Stage 2: Security Scanning                              │ │
│  │  - GitLeaks: Scan for secrets                           │ │
│  │  - Snyk: Check dependencies                             │ │
│  │  - Trivy: Scan containers                               │ │
│  │  - SonarCloud: Code quality                             │ │
│  └──────────────────────────────────────────────────────────┘ │
│                            │                                    │
│                            ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Stage 3: Docker Build                                   │ │
│  │  - Build API Docker image                                │ │
│  │  - Build Web Docker image                                │ │
│  │  - Tag images                                            │ │
│  │  - (Optional) Push to registry                           │ │
│  └──────────────────────────────────────────────────────────┘ │
│                            │                                    │
│                            ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Stage 4: Deploy (if main branch)                        │ │
│  │  - Deploy to production                                  │ │
│  │  - Run smoke tests                                       │ │
│  │  - Notify team                                           │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

### Branch Strategy
```
┌─────────────────────────────────────────────────────────────┐
│  dev branch         →  Development environment              │
│  - Fast feedback                                            │
│  - Basic tests                                              │
│  - Rapid iteration                                          │
└─────────────────────────────────────────────────────────────┘
                             │
                             │ Merge
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  staging branch     →  Staging environment                  │
│  - Integration tests                                        │
│  - Security scans                                           │
│  - QA validation                                            │
└─────────────────────────────────────────────────────────────┘
                             │
                             │ Merge (with approval)
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  main branch        →  Production environment               │
│  - Full test suite                                          │
│  - Security audit                                           │
│  - Manual approval                                          │
│  - Automated deployment                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Container Architecture

### Docker Network
```
┌────────────────────────────────────────────────────────────┐
│                    Docker Network: app-network              │
│                                                             │
│  ┌──────────────┐       ┌──────────────┐       ┌────────┐ │
│  │     web      │──────>│     api      │──────>│   db   │ │
│  │  Container   │       │  Container   │       │Container│
│  │              │       │              │       │        │ │
│  │ nginx:alpine │       │ dotnet:8.0   │       │postgres│
│  │ Port: 3000   │       │ Port: 8080   │       │Port:   │ │
│  │              │       │              │       │5432    │ │
│  └──────────────┘       └──────────────┘       └────────┘ │
│         │                      │                     │     │
│         │                      │                     │     │
└─────────┼──────────────────────┼─────────────────────┼─────┘
          │                      │                     │
          ▼                      ▼                     ▼
    Host Port 3000         Host Port 5000        Host Port 5432
```

### Container Specifications

**Frontend Container:**
- Base: `node:18-alpine` (build), `nginx:alpine` (runtime)
- Size: ~50MB
- User: nginx (non-root)
- Health check: HTTP GET on port 3000

**API Container:**
- Base: `mcr.microsoft.com/dotnet/aspnet:8.0`
- Size: ~220MB
- User: appuser (non-root, UID 1000)
- Health check: HTTP GET /health

**Database Container:**
- Base: `postgres:16-alpine`
- Size: ~238MB
- Persistent volume: postgres-data
- Health check: pg_isready command

---

## Scalability Considerations

### Horizontal Scaling

The architecture supports horizontal scaling:
```
┌─────────────────────────────────────────────────────────────┐
│                      Load Balancer                          │
└─────────────┬───────────────────────┬───────────────────────┘
              │                       │
              ▼                       ▼
┌──────────────────┐        ┌──────────────────┐
│   API Instance 1 │        │   API Instance 2 │
│   (Container)    │        │   (Container)    │
└────────┬─────────┘        └────────┬─────────┘
         │                           │
         └───────────┬───────────────┘
                     │
                     ▼
           ┌──────────────────┐
           │   PostgreSQL     │
           │  (Single/Cluster)│
           └──────────────────┘
```

**Stateless API Design:**
- JWT tokens (no server-side sessions)
- No local file storage
- Database for all persistent data

**Scaling Strategies:**
1. Container orchestration (Kubernetes)
2. Cloud auto-scaling groups
3. Database read replicas
4. CDN for static assets

---

## Performance Optimization

### Caching Strategy
```
┌──────────┐
│  Client  │
└────┬─────┘
     │
     │ 1. Check localStorage (JWT)
     │
     ▼
┌──────────┐
│   API    │
└────┬─────┘
     │
     │ 2. Database query with indexes
     │
     ▼
┌──────────┐
│ Database │
└──────────┘
```

**Future Enhancements:**
- Redis for session caching
- CDN for static assets
- Database query caching
- API response caching

### Database Optimization

- Indexed columns: UserId, Username, Email
- Connection pooling via EF Core
- Parameterized queries
- Lazy loading disabled

---

## Monitoring & Observability

### Logging Architecture
```
┌──────────────────────────────────────────────────────────────┐
│                     Application Logs                         │
│                                                               │
│  ┌────────────┐      ┌────────────┐      ┌────────────┐    │
│  │  Frontend  │      │    API     │      │  Database  │    │
│  │   Logs     │      │   Logs     │      │   Logs     │    │
│  │            │      │            │      │            │    │
│  │ - Console  │      │ - Serilog  │      │ - pg_log   │    │
│  │ - Browser  │      │ - File     │      │            │    │
│  │   DevTools │      │ - Console  │      │            │    │
│  └────────────┘      └────────────┘      └────────────┘    │
│                                                               │
│  Future: Centralized logging (ELK, CloudWatch, etc.)        │
└──────────────────────────────────────────────────────────────┘
```

### Health Monitoring

**Endpoints:**
- `/health` - API health status
- `/api/health` - Detailed health with database check

**Metrics to Monitor:**
- Response times
- Error rates
- Database connection pool
- Container resource usage (CPU/Memory)

---

## Technology Decisions (ADR)

### Why .NET 8.0?
- Modern, high-performance framework
- Strong typing and compile-time checks
- Excellent tooling and IDE support
- Cross-platform (Linux containers)
- Enterprise-grade security features

### Why React?
- Component-based architecture
- Large ecosystem and community
- Modern hooks API
- Excellent developer experience
- Easy to learn and maintain

### Why PostgreSQL?
- Open-source and free
- ACID compliance
- JSON support for flexibility
- Excellent performance
- Strong community and tooling

### Why Docker?
- Consistent environments (dev = prod)
- Easy local development
- Simplified deployment
- Resource efficiency
- Cloud-native ready

---

## Future Architecture Enhancements

1. **Microservices Split**
   - Separate authentication service
   - Task service
   - Notification service

2. **Message Queue**
   - RabbitMQ or AWS SQS
   - Async task processing
   - Event-driven architecture

3. **Caching Layer**
   - Redis for sessions
   - API response caching
   - Database query cache

4. **API Gateway**
   - Rate limiting
   - Request routing
   - Authentication centralization

5. **Service Mesh**
   - Istio or Linkerd
   - Traffic management
   - Observability

---

## Conclusion

This architecture demonstrates:
- ✅ Cloud-native design principles
- ✅ Security-first approach
- ✅ DevOps best practices
- ✅ Scalable foundation
- ✅ Production-ready patterns

**Ready for enterprise deployment while maintainable for portfolio demonstration.**

---

**Last Updated:** November 2024  
**Author:** Malusi Thandolwethu Nathan Nkosi