# ATHENEA Technical Architecture

## System Architecture Overview

ATHENEA follows a microservices architecture with separate frontend applications for mobile and desktop, communicating with a unified backend API. The system is designed for scalability, reliability, and offline-first functionality.

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT APPLICATIONS                      │
├─────────────────────┬─────────────────────┬─────────────────┤
│   React Native      │     Electron        │   Web Portal    │
│   Mobile App        │   Desktop App       │   (Client View) │
│   (iOS/Android)     │  (Win/Mac/Linux)    │                 │
└─────────────────────┴─────────────────────┴─────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │     API Gateway       │
                    │   (Rate Limiting,     │
                    │   Authentication)     │
                    └───────────┬───────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND SERVICES                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Auth      │  │  Project    │  │  Inventory  │         │
│  │  Service    │  │  Service    │  │  Service    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Notification│  │  Reporting  │  │ File Upload │         │
│  │  Service    │  │  Service    │  │  Service    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                    DATA LAYER                               │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ PostgreSQL  │  │    Redis    │  │   AWS S3    │         │
│  │ (Primary DB)│  │  (Caching)  │  │(File Storage│         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. API Gateway
- **Technology**: Express.js with Helmet, CORS
- **Responsibilities**:
  - Request routing and load balancing
  - Authentication and authorization
  - Rate limiting and DDoS protection
  - Request/response logging and monitoring

### 2. Authentication Service
- **Technology**: Auth0 integration with JWT
- **Features**:
  - Multi-factor authentication (MFA)
  - Role-based access control (RBAC)
  - Session management
  - Password policies and security

### 3. Project Management Service
- **Responsibilities**:
  - Project CRUD operations
  - Budget and timeline tracking
  - Progress calculation algorithms
  - Executive dashboard data aggregation

### 4. Real-time Communication
- **Technology**: WebSocket (Socket.io)
- **Features**:
  - Live project updates
  - Real-time collaboration on floor plans
  - Instant notifications
  - Offline queue management

### 5. File Management Service
- **Technology**: AWS S3 + CloudFront CDN
- **Features**:
  - PDF floor plan storage and processing
  - Image compression and optimization
  - Version control for documents
  - Secure file access with signed URLs

## Database Architecture

### PostgreSQL Schema Design
```sql
-- Core Tables Structure
Users (id, email, role, profile_data, created_at, updated_at)
Projects (id, name, client_id, budget_hours, status, created_at)
FloorPlans (id, project_id, pdf_url, version, labels, mod_docs)
Points (id, project_id, label, status, location, technician_id)
Hardware (id, project_id, type, brand, model, serial_number)
Materials (id, project_id, type, quantity, cost, supplier)
CommRooms (id, project_id, status, checklist, photos)
Notifications (id, user_id, type, content, read_at, created_at)
```

### Redis Caching Strategy
- **Session Storage**: User sessions and JWT tokens
- **Real-time Data**: Active project updates and notifications
- **File Metadata**: PDF processing status and metadata
- **API Responses**: Frequently accessed data with TTL

## Security Architecture

### Authentication Flow
1. User login via Auth0
2. JWT token generation with role claims
3. Token validation on each API request
4. Role-based access control enforcement

### Data Protection
- **Encryption at Rest**: AES-256 for database
- **Encryption in Transit**: TLS 1.3 for all communications
- **Data Masking**: Sensitive data protection in logs
- **Access Logging**: Comprehensive audit trail

## Offline-First Strategy

### Mobile Application
- **Local Storage**: SQLite for critical data
- **Sync Queue**: Actions queued when offline
- **Conflict Resolution**: Last-write-wins with manual resolution
- **Background Sync**: Automatic sync when connectivity restored

### Data Synchronization
```javascript
// Sync Strategy Example
{
  "lastSync": "2025-10-17T10:00:00Z",
  "pendingActions": [
    {
      "action": "UPDATE_POINT_STATUS",
      "pointId": "123",
      "newStatus": "IN_PROGRESS",
      "timestamp": "2025-10-17T09:30:00Z"
    }
  ],
  "conflicts": []
}
```

## Performance Optimization

### Backend Optimizations
- **Database Indexing**: Optimized queries for large datasets
- **Connection Pooling**: Efficient database connections
- **Caching Layers**: Multi-level caching strategy
- **API Pagination**: Efficient data loading

### Frontend Optimizations
- **Code Splitting**: Lazy loading of components
- **Image Optimization**: WebP format with fallbacks
- **Offline Caching**: Service workers for web, native storage for mobile
- **Bundle Optimization**: Tree shaking and minification

## Monitoring & Observability

### Application Monitoring
- **APM**: New Relic or Datadog for performance monitoring
- **Error Tracking**: Sentry for error collection and analysis
- **Logging**: Structured logging with correlation IDs
- **Metrics**: Custom business metrics and KPIs

### Infrastructure Monitoring
- **Server Metrics**: CPU, memory, disk usage
- **Database Performance**: Query performance and connection pooling
- **Network Latency**: API response times and throughput
- **Security Events**: Failed authentication attempts and suspicious activity

## Scalability Considerations

### Horizontal Scaling
- **Load Balancing**: Multiple API server instances
- **Database Sharding**: Partition by project or organization
- **CDN Distribution**: Global file delivery
- **Auto-scaling**: Cloud-based auto-scaling groups

### Vertical Scaling
- **Database Optimization**: Query optimization and indexing
- **Memory Management**: Efficient caching strategies
- **CPU Optimization**: Asynchronous processing for heavy operations

## Deployment Architecture

### Development Environment
- Local Docker containers
- Hot reloading for rapid development
- Mock services for external dependencies

### Staging Environment
- Production-like environment
- Automated testing pipeline
- Performance benchmarking

### Production Environment
- High availability setup
- Blue-green deployments
- Automated rollback capabilities
- Comprehensive monitoring and alerting

## Technology Decisions

### Why Node.js?
- JavaScript ecosystem consistency
- Excellent WebSocket support
- Rich package ecosystem (npm)
- Strong community and enterprise support

### Why PostgreSQL?
- ACID compliance for critical data
- Advanced JSON support for flexible schemas
- Excellent performance with proper indexing
- Strong consistency guarantees

### Why React Native?
- Code sharing between iOS and Android
- Native performance with JavaScript flexibility
- Large community and ecosystem
- Cost-effective development

### Why Electron?
- Cross-platform desktop support
- Web technology reuse
- Easy distribution and updates
- Rich native integrations

This architecture provides a robust foundation for the ATHENEA application, ensuring scalability, reliability, and maintainability as the system grows.