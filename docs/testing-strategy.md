# ATHENEA Testing Strategy

## Testing Philosophy

ATHENEA follows a comprehensive testing strategy designed to ensure reliability, security, and performance across all components of the system. Our testing approach includes multiple layers from unit tests to end-to-end testing.

## Testing Pyramid

```
                    E2E Tests
                  ───────────────
                Integration Tests  
              ─────────────────────────
          Unit Tests (API & Frontend)
        ───────────────────────────────────
    Static Analysis (Linting & Type Checking)
  ─────────────────────────────────────────────
```

## Test Categories

### 1. Static Analysis
- **ESLint**: Code quality and consistency
- **TypeScript**: Type safety (where applicable)
- **Prettier**: Code formatting
- **Security Linting**: Security vulnerability detection

### 2. Unit Tests
**Target Coverage**: 85%+

#### Backend Unit Tests
- **Framework**: Jest
- **Coverage**: All utility functions, middleware, and services
- **Mocking**: Database calls, external APIs, and file operations

**Test Categories**:
- Authentication middleware
- Validation functions
- Business logic services
- Utility functions
- Error handling

#### Frontend Unit Tests
- **Framework**: Jest + React Native Testing Library
- **Coverage**: Components, hooks, and utility functions
- **Mocking**: API calls and native modules

### 3. Integration Tests
**Target Coverage**: Key workflows

#### API Integration Tests
- **Framework**: Jest + Supertest
- **Database**: Test database with fixtures
- **Coverage**: Full API endpoints with authentication

**Test Scenarios**:
- User authentication flow
- Project CRUD operations
- File upload and processing
- Real-time WebSocket events
- Role-based access control

#### Database Integration Tests
- **Framework**: Jest + Test DB
- **Coverage**: Complex queries and transactions
- **Data Integrity**: Foreign key constraints and validations

### 4. End-to-End Tests
**Framework**: Detox (React Native) + Playwright (Web)

**Critical User Journeys**:
1. User login and project selection
2. Floor plan upload and label placement
3. Point status updates with photos
4. Material usage recording
5. Report generation and export
6. Offline/online synchronization

## Test Environment Setup

### Test Database
```sql
-- Separate test database
CREATE DATABASE ATHENEA_test;
-- Automated cleanup between tests
-- Isolated test data fixtures
```

### Test Configuration
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: ['**/__tests__/**/*.test.js'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85
    }
  }
};
```

### Mock Strategy
- **API Calls**: Mock external services (Auth0, AWS S3, Firebase)
- **Database**: Use test database with controlled fixtures
- **File System**: Mock file operations for unit tests
- **Time**: Mock date/time functions for consistent tests

## Test Data Management

### Fixtures and Factories
```javascript
// User factory example
const createUser = (overrides = {}) => ({
  email: 'test@example.com',
  role: 'technician',
  first_name: 'Test',
  last_name: 'User',
  is_active: true,
  ...overrides
});

// Project factory
const createProject = (overrides = {}) => ({
  name: 'Test Project',
  status: 'active',
  budget_hours: 100,
  ...overrides
});
```

### Database Seeding
- Automated test data generation
- Consistent test scenarios
- Easy cleanup between tests
- Realistic data relationships

## Authentication Testing

### JWT Token Testing
```javascript
describe('Authentication Middleware', () => {
  test('should authenticate valid JWT token', async () => {
    const token = generateTestToken({ userId: 1, role: 'technician' });
    const response = await request(app)
      .get('/api/v1/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });

  test('should reject invalid token', async () => {
    await request(app)
      .get('/api/v1/users/profile')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);
  });
});
```

### Role-Based Access Testing
- Test each endpoint with different user roles
- Verify permission boundaries
- Test unauthorized access attempts

## API Testing Strategy

### Test Structure
```javascript
describe('Projects API', () => {
  beforeEach(async () => {
    await setupTestDatabase();
  });

  afterEach(async () => {
    await cleanupTestDatabase();
  });

  describe('GET /projects', () => {
    test('should return projects for authenticated user', async () => {
      // Test implementation
    });

    test('should filter projects by status', async () => {
      // Test implementation  
    });

    test('should paginate results', async () => {
      // Test implementation
    });
  });
});
```

### Error Testing
- Invalid input validation
- Database constraint violations
- Network timeout scenarios
- Rate limiting behavior

## Performance Testing

### Load Testing
**Tools**: Artillery.io, K6

**Scenarios**:
- Concurrent user authentication
- Multiple file uploads
- Real-time WebSocket connections
- Database query performance

**Targets**:
- API response time: <200ms average
- Concurrent users: 100+
- File upload: 50MB in <30s
- WebSocket latency: <100ms

### Memory and Resource Testing
- Memory leak detection
- Database connection pooling
- File handle management
- CPU usage under load

## Security Testing

### Vulnerability Testing
- **OWASP Top 10**: Automated scanning
- **Dependency Scanning**: npm audit
- **SQL Injection**: Parameterized query testing
- **XSS Protection**: Input sanitization testing

### Authentication Security
```javascript
describe('Security Tests', () => {
  test('should prevent SQL injection', async () => {
    const maliciousInput = "'; DROP TABLE users; --";
    await request(app)
      .get(`/api/v1/users?search=${maliciousInput}`)
      .expect(400);
  });

  test('should rate limit requests', async () => {
    const promises = Array(101).fill().map(() =>
      request(app).get('/api/v1/projects')
    );
    const results = await Promise.allSettled(promises);
    expect(results.some(r => r.value?.status === 429)).toBe(true);
  });
});
```

## Mobile App Testing

### Unit Testing
- Component rendering
- Hook behavior
- Navigation flows
- Offline data handling

### Integration Testing
- API integration
- Device feature access (camera, storage)
- Push notification handling
- Background synchronization

### Device Testing
- iOS: Simulator + Physical devices (iPhone 12+)
- Android: Emulator + Physical devices (API 28+)
- Different screen sizes and orientations
- Various OS versions

## Continuous Integration

### GitHub Actions Workflow
```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Run unit tests
        run: npm run test:coverage
      
      - name: Run integration tests
        run: npm run test:integration
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### Quality Gates
- All tests must pass
- Code coverage >85%
- No high/critical security vulnerabilities
- Performance benchmarks met

## Test Reporting

### Coverage Reports
- Line, branch, and function coverage
- HTML reports for detailed analysis
- Trend tracking over time
- Integration with CI/CD pipeline

### Test Results
- JUnit XML format for CI integration
- Failed test screenshots (E2E)
- Performance metrics
- Security scan results

## Testing Best Practices

### Test Writing Guidelines
1. **Descriptive Names**: Test names should clearly describe what is being tested
2. **Single Responsibility**: Each test should verify one specific behavior
3. **Independent Tests**: Tests should not depend on other tests
4. **Fast Execution**: Unit tests should run quickly (<5s total)
5. **Deterministic**: Tests should produce consistent results

### Mocking Guidelines
- Mock external dependencies (APIs, databases, file system)
- Don't mock the code under test
- Use realistic mock data
- Verify mock interactions when relevant

### Data Management
- Use factories for test data creation
- Clean up test data after each test
- Use isolated test databases
- Avoid hardcoded test data

## Regression Testing

### Automated Regression Suite
- Critical path testing after each release
- Backward compatibility testing
- Database migration testing
- API contract testing

### Manual Testing Checklist
- Cross-browser compatibility
- Mobile device testing
- Accessibility compliance
- User experience validation

## Performance Benchmarks

### API Performance
- Authentication: <100ms
- CRUD operations: <200ms
- File uploads: <30s for 50MB
- Report generation: <5s

### Mobile App Performance
- Cold start: <3s
- Navigation: <500ms
- Offline sync: <30s full sync
- Memory usage: <150MB

### Database Performance  
- Query response: <50ms average
- Connection establishment: <100ms
- Concurrent connections: 50+

This comprehensive testing strategy ensures ATHENEA maintains high quality, security, and performance standards throughout development and production.