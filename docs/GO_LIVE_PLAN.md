# SkillSwap Go-Live Plan

**Document Version**: 1.0  
**Last Updated**: January 10, 2026  
**Status**: Planning Phase

---

## Executive Summary

This document outlines the plan to transition SkillSwap from a local hackathon MVP to a production-ready AWS-native application. The architecture prioritizes **scale-to-zero** capabilities to minimize costs during the MVP phase while maintaining the ability to scale as user adoption grows.

**Key Principles**:
- AWS-native services for reliability and integration
- Serverless-first for cost optimization
- Scale-to-zero where possible
- No vendor lock-in for email (own infrastructure)
- Realistic cost projections for MVP sustainability

---

## Table of Contents

1. [Recommended Architecture](#recommended-architecture)
2. [Database Decision: SQL vs NoSQL](#database-decision-sql-vs-nosql)
3. [Email Infrastructure: SESMailEngine](#email-infrastructure-sesmailengine)
4. [Service-by-Service Breakdown](#service-by-service-breakdown)
5. [Migration Path](#migration-path)
6. [Financial Plan](#financial-plan)
7. [Success Evaluation](#success-evaluation)
8. [Risk Assessment](#risk-assessment)
9. [Timeline](#timeline)

---

## Recommended Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Route 53 (DNS)                                  │
│                         skillswap.app / skillswap.io                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AWS Amplify Hosting                                  │
│                    React PWA (Static + CloudFront CDN)                      │
│                    - Auto SSL/TLS certificates                              │
│                    - Git-based CI/CD                                        │
│                    - Global edge distribution                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           API Gateway (HTTP API)                             │
│                    - REST endpoints for /api/*                              │
│                    - JWT authorizer (Cognito)                               │
│                    - Rate limiting & throttling                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
          ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
          │  Lambda: Auth   │ │ Lambda: Matches │ │ Lambda: Meetings│
          │  - Register     │ │ - Discover      │ │ - Propose       │
          │  - Login        │ │ - Interest      │ │ - Accept        │
          │  - Password     │ │ - Mutual        │ │ - Confirm       │
          └────────┬────────┘ └────────┬────────┘ └────────┬────────┘
                   │                   │                   │
                   └───────────────────┼───────────────────┘
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Aurora Serverless v2 (PostgreSQL)                         │
│                    - Scale to 0 ACUs when idle                              │
│                    - Auto-pause after inactivity                            │
│                    - Min: 0 ACU, Max: 4 ACU                                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SESMailEngine (Email)                                │
│                    - EventBridge integration                                │
│                    - Automatic bounce handling                              │
│                    - Reputation protection                                  │
│                    - One-time purchase, no monthly fees                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Database Decision: SQL vs NoSQL

### The Question: Is DynamoDB Sufficient?

**Short Answer**: No. **Aurora Serverless v2 (PostgreSQL)** is recommended.

### Why SQL Over NoSQL for SkillSwap

| Factor | DynamoDB (NoSQL) | Aurora Serverless v2 (SQL) | Winner |
|--------|------------------|---------------------------|--------|
| **Matching Queries** | Complex, requires GSIs | Native JOINs, easy | ✅ Aurora |
| **Skill Relationships** | Denormalized, duplicated | Normalized, clean | ✅ Aurora |
| **Geospatial Queries** | Limited, workarounds needed | PostGIS extension | ✅ Aurora |
| **Ad-hoc Queries** | Requires pre-planned indexes | Flexible SQL | ✅ Aurora |
| **Scale to Zero** | ❌ Always-on (on-demand mode) | ✅ 0 ACUs when idle | ✅ Aurora |
| **Cost at Low Volume** | ~$1.25/month minimum | $0 when idle | ✅ Aurora |
| **Migration Effort** | High (rewrite queries) | Low (SQL compatible) | ✅ Aurora |

### SkillSwap's Query Patterns Favor SQL

Our matching algorithm requires:
```sql
-- Find users who offer what I need AND need what I offer
SELECT u.*, 
       GROUP_CONCAT(CASE WHEN us.type = 'offer' THEN us.skill_name END) as offers,
       GROUP_CONCAT(CASE WHEN us.type = 'need' THEN us.skill_name END) as needs
FROM users u
JOIN user_skills us ON u.id = us.user_id
WHERE u.id != ?
  AND EXISTS (SELECT 1 FROM user_skills WHERE user_id = u.id AND type = 'offer' 
              AND skill_name IN (SELECT skill_name FROM user_skills WHERE user_id = ? AND type = 'need'))
  AND EXISTS (SELECT 1 FROM user_skills WHERE user_id = u.id AND type = 'need'
              AND skill_name IN (SELECT skill_name FROM user_skills WHERE user_id = ? AND type = 'offer'))
```

This query is natural in SQL but would require multiple DynamoDB queries and client-side filtering.

### Aurora Serverless v2 Scale-to-Zero

As of November 2024, Aurora Serverless v2 supports scaling to **0 ACUs**:
- Database auto-pauses after period of inactivity
- First connection triggers automatic resume (~15-30 seconds cold start)
- Perfect for MVP with sporadic usage
- Storage costs remain (~$0.10/GB/month) but compute is $0 when idle

**Configuration**:
```
Minimum ACUs: 0
Maximum ACUs: 4
Auto-pause timeout: 5 minutes of inactivity
```

---

## Email Infrastructure: SESMailEngine

### Why SESMailEngine Over SendGrid/Mailgun?

| Factor | SendGrid/Mailgun | SESMailEngine |
|--------|------------------|---------------|
| **Pricing Model** | Monthly subscription | £199 one-time purchase |
| **Cost at 10k emails/month** | $15-35/month | ~$1 (SES costs only) |
| **Cost at 100k emails/month** | $50-100/month | ~$10 (SES costs only) |
| **Infrastructure** | Third-party hosted | Runs in YOUR AWS account |
| **Data Sovereignty** | Data leaves your account | Data stays in your account |
| **Vendor Lock-in** | High | None (you own the code) |
| **Idle Cost** | Monthly minimum | $0 (serverless) |

### Why SESMailEngine Fits SkillSwap Perfectly

1. **One-Time Purchase, Zero Monthly Fees**
   - £199 one-time (~$250 USD), own forever
   - 30-day Product Conformance Guarantee
   - Only pay AWS SES costs ($0.10/1000 emails)
   - No per-seat pricing, no contracts

2. **Scale-to-Zero Architecture**
   - Built on Lambda + EventBridge
   - Zero cost when not sending emails
   - Perfect for MVP with low initial volume

3. **AWS-Native Integration**
   - Deploys directly to your AWS account
   - Uses EventBridge for event-driven sending
   - Integrates with existing Lambda functions

4. **Reputation Protection**
   - Automatic bounce/complaint handling
   - Centralized suppression list
   - Prevents architecture mistakes that damage SES reputation

5. **Production-Ready Features**
   - Jinja2 email templates
   - Real-time delivery tracking
   - CloudWatch alarms pre-configured

### SESMailEngine Cost Example

| Monthly Volume | SES Cost | SESMailEngine | SendGrid | Savings vs SendGrid |
|----------------|----------|---------------|----------|---------------------|
| 1,000 emails | $0.10 | $0/month | $20/month | $240/year |
| 10,000 emails | $1.00 | $0/month | $20/month | $228/year |
| 100,000 emails | $10.00 | $0/month | $90/month | $960/year |

**One-time cost**: £199 (~$250)  
**Break-even vs SendGrid**: ~12 months (then pure savings)

---

## Service-by-Service Breakdown

### 1. Route 53 (DNS)

**Purpose**: Domain management and DNS routing

**Configuration**:
- Register `skillswap.app` or `skillswap.io`
- A record → Amplify distribution
- MX records → SES for email receiving (optional)

**Cost**:
- Domain: $12-35/year depending on TLD
- Hosted zone: $0.50/month
- Queries: $0.40/million (negligible)

**Monthly Cost**: ~$1-3/month

### 2. AWS Amplify Hosting

**Purpose**: Host React PWA with global CDN

**Why Amplify Over S3+CloudFront**:
- Automatic SSL certificates
- Git-based CI/CD built-in
- Preview deployments for PRs
- Simpler configuration

**Configuration**:
- Connect to GitHub repository
- Build command: `npm run build`
- Publish directory: `dist`
- Environment variables for API URL

**Cost**:
- Build: $0.01/minute (free tier: 1000 min/month)
- Hosting: $0.15/GB served (free tier: 15 GB/month)
- Storage: $0.023/GB (free tier: 5 GB)

**Monthly Cost (MVP)**: $0-5/month

### 3. API Gateway (HTTP API)

**Purpose**: REST API endpoint management

**Why HTTP API Over REST API**:
- 70% cheaper than REST API
- Lower latency
- Sufficient for our needs (no caching, no API keys)

**Configuration**:
- Routes: `/api/auth/*`, `/api/users/*`, `/api/matches/*`, `/api/meetings/*`
- Authorizer: JWT (Cognito or custom)
- CORS: Allow Amplify domain

**Cost**:
- $1.00/million requests (free tier: 1M/month for 12 months)

**Monthly Cost (MVP)**: $0-2/month

### 4. AWS Lambda (Backend)

**Purpose**: Serverless compute for API handlers

**Function Structure**:
```
functions/
├── auth/
│   ├── register.js
│   ├── login.js
│   └── password-reset.js
├── users/
│   ├── profile.js
│   └── skills.js
├── matches/
│   ├── discover.js
│   ├── interest.js
│   └── mutual.js
└── meetings/
    ├── propose.js
    ├── accept.js
    └── confirm.js
```

**Configuration**:
- Runtime: Node.js 20.x
- Memory: 256-512 MB
- Timeout: 10 seconds
- VPC: Required for Aurora access

**Cost**:
- $0.20/million requests
- $0.0000166667/GB-second
- Free tier: 1M requests, 400,000 GB-seconds/month

**Monthly Cost (MVP)**: $0-5/month

### 5. Aurora Serverless v2 (PostgreSQL)

**Purpose**: Relational database with scale-to-zero

**Configuration**:
```
Engine: PostgreSQL 15
Min ACUs: 0 (scale to zero)
Max ACUs: 4 (handles ~1000 concurrent users)
Auto-pause: 5 minutes
Storage: Start with 10 GB
```

**Cost**:
- ACU-hour: $0.12/ACU-hour (us-east-1)
- Storage: $0.10/GB/month
- I/O: $0.20/million requests

**Monthly Cost Scenarios**:
| Usage | ACU Hours | Storage | I/O | Total |
|-------|-----------|---------|-----|-------|
| Idle (0 users) | 0 | $1 | $0 | ~$1/month |
| Light (100 users) | 10 | $1 | $0.50 | ~$3/month |
| Moderate (1000 users) | 100 | $2 | $2 | ~$16/month |

**Monthly Cost (MVP)**: $1-5/month

### 6. Amazon Cognito (Authentication)

**Purpose**: User authentication and JWT tokens

**Why Cognito Over Custom Auth**:
- Managed user pools
- Built-in password reset flow
- MFA support ready
- Social login ready (future)

**Configuration**:
- User pool with email sign-in
- Password policy: 8+ chars
- Email verification via SES

**Cost**:
- Free tier: 50,000 MAUs
- After: $0.0055/MAU

**Monthly Cost (MVP)**: $0 (well under 50k users)

### 7. SESMailEngine + Amazon SES

**Purpose**: Transactional email (password reset, notifications)

**Configuration**:
- Deploy SESMailEngine CloudFormation stack
- Configure email templates
- Set up EventBridge rules

**Cost**:
- SESMailEngine: £199 one-time (~$250 USD)
- SES: $0.10/1000 emails
- Free tier: 3000 emails/month (first 12 months)

**Monthly Cost (MVP)**: $0-1/month

### 8. CloudWatch (Monitoring)

**Purpose**: Logs, metrics, alarms

**Configuration**:
- Lambda logs (auto)
- API Gateway access logs
- Aurora performance insights
- Custom alarms for errors

**Cost**:
- Logs: $0.50/GB ingested
- Metrics: $0.30/metric/month (first 10 free)
- Alarms: $0.10/alarm/month

**Monthly Cost (MVP)**: $1-3/month

---

## Migration Path

### Phase 1: Infrastructure Setup (Week 1)

1. **AWS Account Setup**
   - Create production AWS account
   - Enable AWS Organizations (optional)
   - Set up IAM roles and policies
   - Enable CloudTrail for audit

2. **Domain & DNS**
   - Register domain in Route 53
   - Create hosted zone
   - Request SSL certificate in ACM

3. **Database**
   - Create Aurora Serverless v2 cluster
   - Configure VPC and security groups
   - Run schema migrations
   - Test scale-to-zero behavior

### Phase 2: Backend Migration (Week 2)

1. **Lambda Functions**
   - Convert Express routes to Lambda handlers
   - Set up API Gateway routes
   - Configure VPC for database access
   - Test each endpoint

2. **Authentication**
   - Set up Cognito user pool
   - Migrate auth logic to Cognito
   - Update JWT validation

3. **Email**
   - Deploy SESMailEngine
   - Verify domain in SES
   - Create email templates
   - Test password reset flow

### Phase 3: Frontend Deployment (Week 3)

1. **Amplify Setup**
   - Connect GitHub repository
   - Configure build settings
   - Set environment variables
   - Deploy to staging

2. **PWA Configuration**
   - Update API URLs
   - Test service worker
   - Verify offline functionality
   - Test install prompt

3. **DNS Cutover**
   - Point domain to Amplify
   - Verify SSL working
   - Test all flows end-to-end

### Phase 4: Production Hardening (Week 4)

1. **Security**
   - Enable WAF on API Gateway
   - Configure rate limiting
   - Set up DDoS protection
   - Security audit

2. **Monitoring**
   - Set up CloudWatch dashboards
   - Configure alarms
   - Set up error notifications
   - Performance baseline

3. **Documentation**
   - Update README for production
   - Document runbooks
   - Create incident response plan

---

## Financial Plan

### One-Time Costs

| Item | Cost | Notes |
|------|------|-------|
| Domain Registration | $12-35 | .app or .io TLD |
| SESMailEngine License | £199 (~$250) | One-time purchase, 30-day guarantee |
| **Total One-Time** | **~$265-285** | |

### Monthly Operating Costs (MVP Phase)

**Scenario: 0-100 Active Users**

| Service | Cost | Notes |
|---------|------|-------|
| Route 53 | $1 | Hosted zone + queries |
| Amplify Hosting | $0-2 | Within free tier |
| API Gateway | $0 | Within free tier |
| Lambda | $0 | Within free tier |
| Aurora Serverless v2 | $1-3 | Mostly idle, storage only |
| Cognito | $0 | Under 50k MAU |
| SES | $0 | Under 3k emails |
| CloudWatch | $1-2 | Basic monitoring |
| **Total Monthly** | **$3-8** | |

**Scenario: 100-1,000 Active Users**

| Service | Cost | Notes |
|---------|------|-------|
| Route 53 | $1 | |
| Amplify Hosting | $2-5 | Increased traffic |
| API Gateway | $1-2 | ~500k requests |
| Lambda | $2-5 | Increased invocations |
| Aurora Serverless v2 | $5-15 | More active hours |
| Cognito | $0 | Still under 50k |
| SES | $1-2 | ~10k emails |
| CloudWatch | $3-5 | More logs |
| **Total Monthly** | **$15-35** | |

**Scenario: 1,000-10,000 Active Users**

| Service | Cost | Notes |
|---------|------|-------|
| Route 53 | $2 | |
| Amplify Hosting | $10-20 | |
| API Gateway | $5-10 | |
| Lambda | $10-20 | |
| Aurora Serverless v2 | $30-60 | More consistent usage |
| Cognito | $0-50 | Approaching 50k |
| SES | $5-10 | ~50k emails |
| CloudWatch | $10-15 | |
| **Total Monthly** | **$70-185** | |

### Development Costs

**Option A: Solo Developer (Bootstrapped)**
- Time: 4-6 weeks part-time
- Cost: $0 (sweat equity)
- Risk: Slower iteration, single point of failure

**Option B: Freelance Developer**
- Time: 2-3 weeks full-time
- Cost: $5,000-15,000
- Risk: Quality varies, handoff challenges

**Option C: Small Agency**
- Time: 3-4 weeks
- Cost: $15,000-40,000
- Risk: Higher cost, but more reliable

**Recommended for MVP**: Option A or B
- Total budget needed: $500-5,000 for first 6 months
- Includes: Infrastructure + minimal development help

### 12-Month Financial Projection

| Month | Users | Revenue* | AWS Cost | Net |
|-------|-------|----------|----------|-----|
| 1 | 50 | $0 | $5 | -$5 |
| 2 | 100 | $0 | $8 | -$8 |
| 3 | 200 | $0 | $12 | -$12 |
| 4 | 400 | $0 | $18 | -$18 |
| 5 | 700 | $0 | $25 | -$25 |
| 6 | 1,000 | $0 | $35 | -$35 |
| 7 | 1,500 | $100** | $45 | +$55 |
| 8 | 2,000 | $200 | $55 | +$145 |
| 9 | 3,000 | $400 | $70 | +$330 |
| 10 | 4,000 | $600 | $90 | +$510 |
| 11 | 5,500 | $900 | $110 | +$790 |
| 12 | 7,000 | $1,200 | $130 | +$1,070 |

*Revenue assumes freemium model with premium features introduced Month 7
**Premium tier: $5/month for enhanced features (badges, priority matching, etc.)

**Year 1 Total**:
- AWS Costs: ~$600
- One-time Costs: ~$130
- **Total Investment**: ~$730
- **Break-even**: Month 7-8 (if monetization works)

---

## Success Evaluation

### Realistic Assessment

**This is not a guaranteed success.** Here's an honest evaluation:

#### Market Analysis

**Positive Signals**:
- Nextdoor proves neighborhood apps can work (46M WAU, $65M quarterly revenue)
- Urban loneliness is a documented problem (growing market)
- Skill exchange is a proven concept (time banks exist)
- Mandatory coffee meeting is genuinely innovative

**Negative Signals**:
- 90%+ of social apps fail in year one
- Network effects are brutal (need critical mass per neighborhood)
- Nextdoor took 10+ years and $500M+ to reach current scale
- User acquisition cost for social apps is high

#### Success Probability Estimate

| Outcome | Probability | Definition |
|---------|-------------|------------|
| **Failure** | 60-70% | <1,000 users after 12 months, shut down |
| **Survival** | 20-25% | 1,000-10,000 users, break-even, slow growth |
| **Moderate Success** | 8-12% | 10,000-100,000 users, profitable, regional |
| **Major Success** | 2-5% | 100,000+ users, VC-fundable, national scale |

**Why These Numbers?**
- Base rate for consumer social apps: ~5% survive 5 years
- SkillSwap has differentiation (coffee meeting) but unproven
- No existing user base or brand recognition
- Requires geographic density to work

#### Critical Success Factors

1. **Geographic Density** (Most Important)
   - Need 50+ active users per neighborhood to create matches
   - Cold start problem is severe
   - Strategy: Launch in ONE city, ONE neighborhood first

2. **Retention**
   - Users must complete the full flow (match → meet → swap)
   - If coffee meetings don't happen, value proposition fails
   - Target: 30%+ of matches result in meetings

3. **Word of Mouth**
   - Social apps live or die by organic growth
   - Paid acquisition is usually unsustainable
   - Target: 50%+ of new users from referrals

4. **Monetization Timing**
   - Too early kills growth
   - Too late burns runway
   - Target: Introduce premium at 5,000+ users

#### Honest Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| No one shows up to coffee | High | Fatal | Strong onboarding, reminders |
| Can't achieve density | High | Fatal | Hyper-local launch strategy |
| Users ghost after matching | Medium | High | Reputation system, reviews |
| Competitor copies idea | Medium | Medium | First-mover advantage, community |
| Safety incident | Low | Fatal | Verification, public meeting requirement |
| Technical scaling issues | Low | Medium | Serverless architecture handles this |

#### What Would Change the Odds?

**Increase success probability to 30-40%**:
- Launch with existing community (church, university, company)
- Partner with local coffee shops for promotion
- Get local press coverage
- Secure $50-100k seed funding for marketing

**Increase success probability to 50%+**:
- Celebrity or influencer endorsement
- Viral TikTok/social media moment
- Partnership with Nextdoor or similar platform
- Acquisition by larger company

---

## Risk Assessment

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Aurora cold start latency | Medium | Low | Warm-up Lambda, user education |
| Lambda cold starts | Low | Low | Provisioned concurrency if needed |
| SES reputation damage | Low | High | SESMailEngine handles this |
| Data loss | Very Low | Critical | Automated backups, multi-AZ |

### Business Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Low user adoption | High | Critical | Hyper-local launch, community building |
| Users don't meet in person | Medium | High | Gamification, reminders, incentives |
| Safety incident | Low | Critical | Public meeting requirement, reporting |
| Competitor entry | Medium | Medium | Build community moat, iterate fast |

### Financial Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| AWS costs exceed budget | Low | Medium | Billing alerts, cost optimization |
| Unable to monetize | Medium | High | Multiple revenue streams planned |
| Runway exhaustion | Medium | Critical | Keep costs minimal, bootstrap |

---

## Timeline

### Month 1: Infrastructure & Migration
- Week 1: AWS setup, domain, database
- Week 2: Lambda functions, API Gateway
- Week 3: Frontend deployment, testing
- Week 4: Security hardening, monitoring

### Month 2: Soft Launch
- Week 1: Beta testing with friends/family
- Week 2: Bug fixes, performance tuning
- Week 3: Soft launch in one neighborhood
- Week 4: Gather feedback, iterate

### Month 3-6: Growth Phase
- Focus on one geographic area
- Community building activities
- Iterate based on user feedback
- Prepare for monetization

### Month 7-12: Monetization & Expansion
- Introduce premium features
- Expand to adjacent neighborhoods
- Evaluate scaling needs
- Plan for next phase

---

## Appendix: Architecture Decision Records

### ADR-001: Aurora Serverless v2 over DynamoDB

**Decision**: Use Aurora Serverless v2 (PostgreSQL) instead of DynamoDB

**Context**: Need a database that supports complex matching queries and scales to zero

**Consequences**:
- (+) Natural SQL queries for matching algorithm
- (+) Scale to zero reduces MVP costs
- (+) Easy migration from SQLite
- (-) Cold start latency (~15-30 seconds after idle)
- (-) Requires VPC configuration for Lambda

### ADR-002: SESMailEngine over SendGrid

**Decision**: Use SESMailEngine for email infrastructure

**Context**: Need reliable email delivery without recurring monthly costs

**Consequences**:
- (+) One-time purchase, no monthly fees
- (+) Runs in our AWS account (data sovereignty)
- (+) Automatic reputation protection
- (-) Requires initial setup effort
- (-) Dependent on AWS SES limits

### ADR-003: Amplify over S3+CloudFront

**Decision**: Use AWS Amplify Hosting for frontend

**Context**: Need simple deployment with CI/CD for React PWA

**Consequences**:
- (+) Git-based deployments
- (+) Automatic SSL
- (+) Preview deployments
- (-) Slightly higher cost than raw S3
- (-) Less control than custom CloudFront

---

## Conclusion

SkillSwap can be deployed to production on AWS for approximately **$3-8/month** during the MVP phase, scaling up only as users grow. The architecture prioritizes:

1. **Cost efficiency**: Scale-to-zero services minimize burn rate
2. **Reliability**: AWS-native services with built-in redundancy
3. **Simplicity**: Managed services reduce operational burden
4. **Scalability**: Can handle growth from 0 to 100,000+ users

**Total investment to launch**: ~$285 one-time (domain + SESMailEngine) + ~$50/month for first 6 months = **~$585**

**Realistic success probability**: 20-30% chance of reaching 10,000+ users

The low infrastructure cost means SkillSwap can survive long enough to find product-market fit without significant funding. The key challenge is not technical—it's achieving geographic density and getting users to actually meet for coffee.

**Next Step**: Decide on launch city/neighborhood and begin infrastructure setup.
