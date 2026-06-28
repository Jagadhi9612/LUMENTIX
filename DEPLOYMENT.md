# Deployment Guide for Elite Fitness

## Prerequisites

- Docker and Docker Compose installed
- AWS CLI configured (for AWS deployment)
- Node.js 22+ installed locally
- PostgreSQL 16+ for production database

## Local Development Deployment

```bash
# 1. Clone and setup
git clone <repository>
cd elite-fitness

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env.local
# Edit .env.local with your configuration

# 4. Run with Docker Compose
docker-compose up -d

# 5. Initialize database
npm run db:generate
npm run db:seed

# 6. Access the application
# Web: http://localhost:3000
# API: http://localhost:4000/health
```

## AWS Deployment with ECS

### 1. Prepare AWS Resources

```bash
# Create ECR repositories
aws ecr create-repository --repository-name elite-fitness-api --region us-east-1
aws ecr create-repository --repository-name elite-fitness-web --region us-east-1

# Create RDS PostgreSQL instance
aws rds create-db-instance \
  --db-instance-identifier elite-fitness-prod \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username admin \
  --master-user-password <strong-password> \
  --allocated-storage 100 \
  --backup-retention-period 30
```

### 2. Build and Push Docker Images

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build and push API
docker build -f docker/api.Dockerfile -t elite-fitness-api:latest .
docker tag elite-fitness-api:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/elite-fitness-api:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/elite-fitness-api:latest

# Build and push Web
docker build -f docker/web.Dockerfile -t elite-fitness-web:latest .
docker tag elite-fitness-web:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/elite-fitness-web:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/elite-fitness-web:latest
```

### 3. Create ECS Task Definitions and Services

```bash
# Create API task definition
aws ecs register-task-definition \
  --family elite-fitness-api \
  --network-mode awsvpc \
  --requires-compatibilities FARGATE \
  --cpu 256 \
  --memory 512 \
  --container-definitions file://ecs-task-api.json

# Create Web task definition
aws ecs register-task-definition \
  --family elite-fitness-web \
  --network-mode awsvpc \
  --requires-compatibilities FARGATE \
  --cpu 256 \
  --memory 512 \
  --container-definitions file://ecs-task-web.json
```

## Production Checklist

- [ ] Set strong JWT secrets in production environment
- [ ] Configure SMTP for email notifications
- [ ] Setup Twilio for SMS notifications
- [ ] Configure Stripe API keys for payments
- [ ] Enable HTTPS/SSL certificates
- [ ] Setup CloudFront CDN for static assets
- [ ] Configure backup and disaster recovery
- [ ] Setup monitoring with CloudWatch/APM
- [ ] Enable VPC and security groups
- [ ] Configure WAF rules
- [ ] Enable database encryption at rest
- [ ] Setup automated database backups
- [ ] Configure rate limiting and DDoS protection
- [ ] Enable audit logging
- [ ] Setup alerts for critical errors

## Database Migrations

```bash
# Run migrations in production
npx prisma migrate deploy

# View migration status
npx prisma migrate status

# Create a new migration
npx prisma migrate dev --name migration_name
```

## Monitoring and Logging

```bash
# View API logs
docker logs elite-fitness-api

# View web logs
docker logs elite-fitness-web

# Setup CloudWatch logs
aws logs create-log-group --log-group-name /ecs/elite-fitness-api
```

## Backup and Recovery

```bash
# Backup PostgreSQL
pg_dump -h <host> -U admin elite_fitness > backup.sql

# Restore from backup
psql -h <host> -U admin elite_fitness < backup.sql

# Automated backups with AWS RDS
aws rds create-db-snapshot \
  --db-instance-identifier elite-fitness-prod \
  --db-snapshot-identifier elite-fitness-backup-$(date +%Y%m%d)
```

## Troubleshooting

### API won't start
- Check environment variables are set correctly
- Verify database connectivity
- Check logs: `docker logs elite-fitness-api`

### Database connection issues
- Verify DATABASE_URL is correct
- Check firewall rules
- Ensure PostgreSQL is running

### Deployment failures
- Check CI/CD logs in GitHub Actions
- Verify Docker images are built correctly
- Check ECS task logs in CloudWatch
