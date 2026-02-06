# WireScope Backend

Node.js/Express API server for the WireScope structured cabling management application.

## Features

- **Authentication**: JWT-based authentication with Auth0 integration
- **Role-Based Access Control**: 4-tier user role system
- **Real-time Updates**: WebSocket support for live collaboration
- **File Management**: AWS S3 integration for floor plans and photos
- **Database**: PostgreSQL with Knex.js query builder
- **Caching**: Redis integration for session management
- **API Documentation**: Swagger/OpenAPI documentation
- **Security**: Helmet, CORS, rate limiting, input validation
- **Logging**: Structured logging with Winston

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 7+
- AWS S3 account (for file storage)
- Auth0 account (for production authentication)

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Set up database**:
   ```bash
   # Create database and run migrations
   npm run db:migrate
   
   # Seed with sample data (development)
   npm run db:seed
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

The server will start on http://localhost:3000

## API Documentation

When running in development mode, API documentation is available at:
http://localhost:3000/api-docs

## Environment Variables

See `.env.example` for all required environment variables.

### Required Variables

- `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` - Database connection
- `JWT_SECRET` - JWT signing secret
- `REDIS_HOST` - Redis connection

### Production Additional Variables

- `AUTH0_DOMAIN`, `AUTH0_AUDIENCE` - Auth0 configuration
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` - AWS credentials
- `AWS_S3_BUCKET` - S3 bucket for file storage

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm start` - Start production server
- `npm test` - Run test suite
- `npm run test:coverage` - Run tests with coverage report
- `npm run db:migrate` - Run database migrations
- `npm run db:rollback` - Rollback last migration
- `npm run db:seed` - Seed database with sample data
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors

## Project Structure

```
src/
├── config/           # Configuration files
├── controllers/      # Route controllers
├── middleware/       # Express middleware
├── models/          # Data models
├── routes/          # API routes
├── services/        # Business logic services
├── utils/           # Utility functions
├── database.js      # Database connection
└── server.js        # Main server file

migrations/          # Database migrations
seeds/              # Database seeds
tests/              # Test files
logs/               # Application logs
```

## Authentication

The API supports two authentication modes:

### Development Mode
- Local JWT tokens
- User registration endpoint available
- Test users can be created via API

### Production Mode  
- Auth0 integration
- JWT tokens issued by Auth0
- User management through Auth0 dashboard

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration (dev only)
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - User logout

### Users
- `GET /api/v1/users` - List users (supervisor+)
- `GET /api/v1/users/:id` - Get user details
- `POST /api/v1/users` - Create user (project manager only)
- `PUT /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user (project manager only)

### Projects
- `GET /api/v1/projects` - List projects
- `POST /api/v1/projects` - Create project
- `GET /api/v1/projects/:id` - Get project details
- `PUT /api/v1/projects/:id` - Update project
- `DELETE /api/v1/projects/:id` - Delete project

*Additional endpoints for floor plans, points, materials, etc. are documented in the Swagger documentation.*

## Role Hierarchy

1. **Technician** - Field work execution
2. **Lead Technician** - Technical coordination  
3. **Supervisor** - Team management and approvals
4. **Project Manager** - Full project oversight

## Security Features

- **JWT Authentication** with role-based access control
- **Input Validation** using express-validator
- **Rate Limiting** based on user role
- **CORS Protection** with configurable origins
- **Helmet** for security headers
- **SQL Injection Protection** via parameterized queries
- **XSS Protection** through input sanitization
- **Audit Logging** for all sensitive operations

## Database

The application uses PostgreSQL with Knex.js for:
- **Query Building** - Type-safe query construction
- **Migrations** - Version-controlled schema changes
- **Connection Pooling** - Efficient database connections
- **Transactions** - ACID compliance for complex operations

## Real-time Features

WebSocket support for:
- Live project updates
- Real-time collaboration on floor plans
- Instant notifications
- Status change broadcasts

## Error Handling

Comprehensive error handling with:
- **Structured Error Responses** - Consistent error format
- **Error Logging** - All errors logged with context
- **Validation Errors** - Detailed field-level validation
- **Security Events** - Failed auth attempts logged

## Performance

Optimization features:
- **Redis Caching** - Frequently accessed data
- **Database Indexing** - Optimized query performance  
- **Connection Pooling** - Efficient resource usage
- **Compression** - Gzip response compression
- **Pagination** - Large dataset handling

## Monitoring

Built-in monitoring:
- **Health Check** endpoint at `/health`
- **Structured Logging** with Winston
- **Performance Metrics** tracking
- **Error Rate** monitoring

## Testing

Test coverage includes:
- **Unit Tests** - Individual function testing
- **Integration Tests** - API endpoint testing
- **Authentication Tests** - Security validation
- **Database Tests** - Data integrity verification

Run tests:
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

## Deployment

The application is containerized and can be deployed using:
- **Docker** - Production containerization
- **Kubernetes** - Container orchestration
- **PM2** - Process management
- **Nginx** - Reverse proxy and load balancing

## Contributing

1. Follow the established code style (ESLint configuration)
2. Write tests for new features
3. Update API documentation
4. Follow semantic versioning for releases

## License

This project is proprietary software. All rights reserved.