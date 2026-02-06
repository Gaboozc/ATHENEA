# WireScope Deployment Guide

## Overview

This guide covers the deployment process for WireScope across development, staging, and production environments. The application uses a containerized microservices architecture with automated CI/CD pipelines.

## Infrastructure Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Production Environment                   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   AWS ALB   │  │  CloudFront │  │   Route 53  │         │
│  │(Load Balancer│  │    (CDN)    │  │    (DNS)    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│           │              │              │                   │
│  ┌─────────────────────────────────────────────────────────┤
│  │                EKS Cluster                              │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │  │  API Pods   │  │ Worker Pods │  │ Socket Pods │      │
│  │  │(3 replicas) │  │(2 replicas) │  │(2 replicas) │      │
│  │  └─────────────┘  └─────────────┘  └─────────────┘      │
│  └─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ RDS Postgres│  │ElastiCache  │  │     S3      │         │
│  │ (Multi-AZ)  │  │   Redis     │  │ (Files)     │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

## Environment Configuration

### Development Environment
- **Purpose**: Local development and testing
- **Infrastructure**: Docker Compose
- **Database**: Local PostgreSQL
- **Storage**: Local filesystem
- **Monitoring**: Basic logging

### Staging Environment
- **Purpose**: Integration testing and client demos
- **Infrastructure**: AWS ECS (smaller instance sizes)
- **Database**: RDS PostgreSQL (single AZ)
- **Storage**: S3 bucket (staging)
- **Monitoring**: CloudWatch + basic alerting

### Production Environment
- **Purpose**: Live customer environment
- **Infrastructure**: AWS EKS (Kubernetes)
- **Database**: RDS PostgreSQL (Multi-AZ with read replicas)
- **Storage**: S3 with CloudFront CDN
- **Monitoring**: Full observability stack

## Prerequisites

### AWS Services Required
- **EKS**: Kubernetes cluster management
- **RDS**: PostgreSQL database
- **ElastiCache**: Redis caching
- **S3**: File storage
- **CloudFront**: CDN for file delivery
- **ALB**: Application Load Balancer
- **Route 53**: DNS management
- **IAM**: Access management
- **ECR**: Container registry
- **CloudWatch**: Monitoring and logging

### Third-Party Services
- **Auth0**: Authentication provider
- **Firebase**: Push notifications
- **Sentry**: Error monitoring
- **DataDog**: APM and monitoring

## Container Configuration

### Backend API Dockerfile
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS runtime
WORKDIR /app

# Install security updates
RUN apk update && apk upgrade && apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S wirescope && \
    adduser -S wirescope -u 1001

COPY --from=builder /app/node_modules ./node_modules
COPY . .

# Set ownership and permissions
RUN chown -R wirescope:wirescope /app
USER wirescope

EXPOSE 3000

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/server.js"]
```

### Docker Compose (Development)
```yaml
version: '3.8'

services:
  api:
    build: 
      context: ./wirescope-backend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DB_HOST=postgres
      - REDIS_HOST=redis
    depends_on:
      - postgres
      - redis
    volumes:
      - ./wirescope-backend:/app
      - /app/node_modules

  postgres:
    image: postgres:14-alpine
    environment:
      - POSTGRES_DB=wirescope_dev
      - POSTGRES_USER=wirescope_user
      - POSTGRES_PASSWORD=dev_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - api

volumes:
  postgres_data:
  redis_data:
```

## Kubernetes Configuration

### Namespace Configuration
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: wirescope
  labels:
    name: wirescope
---
apiVersion: v1
kind: ResourceQuota
metadata:
  name: wirescope-quota
  namespace: wirescope
spec:
  hard:
    requests.cpu: "4"
    requests.memory: 8Gi
    limits.cpu: "8"
    limits.memory: 16Gi
    pods: "10"
```

### ConfigMap for Environment Variables
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: wirescope-config
  namespace: wirescope
data:
  NODE_ENV: "production"
  API_VERSION: "v1"
  DB_HOST: "wirescope-postgres.c1234567890.us-east-1.rds.amazonaws.com"
  DB_PORT: "5432"
  DB_NAME: "wirescope_prod"
  REDIS_HOST: "wirescope-redis.abc123.cache.amazonaws.com"
  REDIS_PORT: "6379"
  AWS_REGION: "us-east-1"
  AWS_S3_BUCKET: "wirescope-prod-files"
```

### Secret Configuration
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: wirescope-secrets
  namespace: wirescope
type: Opaque
stringData:
  DB_USER: "wirescope_user"
  DB_PASSWORD: "secure_production_password"
  JWT_SECRET: "super_secure_jwt_secret_key"
  AUTH0_CLIENT_SECRET: "auth0_client_secret"
  AWS_ACCESS_KEY_ID: "aws_access_key"
  AWS_SECRET_ACCESS_KEY: "aws_secret_key"
```

### API Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: wirescope-api
  namespace: wirescope
  labels:
    app: wirescope-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: wirescope-api
  template:
    metadata:
      labels:
        app: wirescope-api
    spec:
      containers:
      - name: api
        image: your-registry/wirescope-api:latest
        ports:
        - containerPort: 3000
        env:
        - name: PORT
          value: "3000"
        envFrom:
        - configMapRef:
            name: wirescope-config
        - secretRef:
            name: wirescope-secrets
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
        securityContext:
          runAsNonRoot: true
          runAsUser: 1001
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
      imagePullSecrets:
      - name: registry-secret
```

### Service Configuration
```yaml
apiVersion: v1
kind: Service
metadata:
  name: wirescope-api-service
  namespace: wirescope
spec:
  selector:
    app: wirescope-api
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: ClusterIP
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: wirescope-ingress
  namespace: wirescope
  annotations:
    kubernetes.io/ingress.class: "alb"
    alb.ingress.kubernetes.io/scheme: "internet-facing"
    alb.ingress.kubernetes.io/target-type: "ip"
    alb.ingress.kubernetes.io/certificate-arn: "arn:aws:acm:us-east-1:123456789:certificate/your-cert-id"
    alb.ingress.kubernetes.io/ssl-policy: "ELBSecurityPolicy-TLS-1-2-2017-01"
spec:
  rules:
  - host: api.wirescope.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: wirescope-api-service
            port:
              number: 80
```

## CI/CD Pipeline

### GitHub Actions Workflow
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  
env:
  AWS_REGION: us-east-1
  ECR_REPOSITORY: wirescope-api
  EKS_CLUSTER_NAME: wirescope-prod

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: 18
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run tests
      run: npm run test:coverage
      
    - name: Run security audit
      run: npm audit --audit-level high
      
  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v2
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: ${{ env.AWS_REGION }}
        
    - name: Login to Amazon ECR
      id: login-ecr
      uses: aws-actions/amazon-ecr-login@v1
      
    - name: Build and push Docker image
      env:
        ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        IMAGE_TAG: ${{ github.sha }}
      run: |
        docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
        docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
        docker tag $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY:latest
        docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest
        
  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v2
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: ${{ env.AWS_REGION }}
        
    - name: Update kubeconfig
      run: |
        aws eks update-kubeconfig --name $EKS_CLUSTER_NAME --region $AWS_REGION
        
    - name: Deploy to EKS
      env:
        ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        IMAGE_TAG: ${{ github.sha }}
      run: |
        sed -i "s|<IMAGE>|$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG|g" k8s/deployment.yaml
        kubectl apply -f k8s/
        kubectl rollout status deployment/wirescope-api -n wirescope --timeout=300s
        
    - name: Run deployment tests
      run: |
        kubectl get pods -n wirescope
        kubectl logs -l app=wirescope-api -n wirescope --tail=50
```

## Database Migration Strategy

### Migration Process
```bash
# Create migration
npm run migration:create add_new_table

# Run migrations in staging
kubectl exec -it deployment/wirescope-api -n wirescope-staging -- npm run db:migrate

# Backup production database
aws rds create-db-snapshot --db-instance-identifier wirescope-prod --db-snapshot-identifier wirescope-backup-$(date +%Y%m%d)

# Run migrations in production
kubectl exec -it deployment/wirescope-api -n wirescope -- npm run db:migrate
```

### Rollback Strategy
```bash
# Rollback application deployment
kubectl rollout undo deployment/wirescope-api -n wirescope

# Rollback database if needed
kubectl exec -it deployment/wirescope-api -n wirescope -- npm run db:rollback

# Restore from snapshot (if critical)
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier wirescope-prod-restored \
  --db-snapshot-identifier wirescope-backup-20231017
```

## Mobile App Deployment

### iOS App Store
```bash
# Build for production
cd wirescope-mobile
npx react-native run-ios --configuration Release

# Archive and upload to App Store Connect
xcodebuild -workspace ios/WireScope.xcworkspace \
           -scheme WireScope \
           -configuration Release \
           -archivePath ./build/WireScope.xcarchive \
           archive

# Upload to App Store
xcodebuild -exportArchive \
           -archivePath ./build/WireScope.xcarchive \
           -exportPath ./build/ \
           -exportOptionsPlist ExportOptions.plist

altool --upload-app \
       --type ios \
       --file ./build/WireScope.ipa \
       --username your-apple-id \
       --password @keychain:altool
```

### Google Play Store
```bash
# Build Android APK/AAB
cd wirescope-mobile/android
./gradlew assembleRelease

# Sign the APK
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 \
          -keystore wirescope-release-key.keystore \
          app/build/outputs/apk/release/app-release-unsigned.apk \
          wirescope

# Upload to Google Play Console (automated via fastlane)
fastlane supply --aab app/build/outputs/bundle/release/app-release.aab
```

## Monitoring and Observability

### Prometheus Configuration
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
    scrape_configs:
    - job_name: 'wirescope-api'
      kubernetes_sd_configs:
      - role: pod
      relabel_configs:
      - source_labels: [__meta_kubernetes_pod_label_app]
        action: keep
        regex: wirescope-api
```

### Grafana Dashboards
- API response times and error rates
- Database performance metrics
- Infrastructure resource utilization
- Business metrics (active users, projects)

### Alerting Rules
```yaml
groups:
- name: wirescope-alerts
  rules:
  - alert: HighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
    for: 5m
    annotations:
      summary: "High error rate detected"
      
  - alert: DatabaseConnectionHigh
    expr: pg_stat_activity_count > 80
    for: 2m
    annotations:
      summary: "High database connection count"
```

## Security Considerations

### Network Security
- VPC with private subnets for databases
- Security groups with minimal required ports
- WAF rules for common attack patterns
- DDoS protection via CloudFlare/AWS Shield

### Container Security
- Non-root user in containers
- Read-only root filesystem
- Security scanning of container images
- Regular base image updates

### Data Security
- Encryption at rest for RDS and S3
- Encryption in transit (TLS 1.3)
- Regular security audits
- Secrets management via AWS Secrets Manager

## Disaster Recovery

### Backup Strategy
- **Database**: Automated daily backups with 30-day retention
- **Files**: S3 cross-region replication
- **Configuration**: GitOps with version control

### Recovery Procedures
1. **RTO (Recovery Time Objective)**: 4 hours
2. **RPO (Recovery Point Objective)**: 1 hour
3. **Failover Process**: Automated via Route 53 health checks
4. **Data Recovery**: Point-in-time recovery from RDS snapshots

### Testing
- Monthly disaster recovery drills
- Automated backup testing
- Documentation updates
- Team training and runbooks

This deployment guide provides a comprehensive foundation for deploying and maintaining WireScope in production environments with high availability, security, and observability.