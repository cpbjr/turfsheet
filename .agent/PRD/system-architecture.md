# TurfSheet PRD: System Architecture

> Extracted from PRD.md lines 2080-2232. Source of truth: [PRD.md](../../PRD.md)

## System Architecture

### Architecture Overview

The system follows a modern three-tier architecture optimized for cost-efficiency and maintainability. A single backend serves both the manager web dashboard and worker mobile apps through a unified REST API.

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                           │
│  ┌──────────────────┐      ┌──────────────────────────┐    │
│  │  Manager Web App │      │   Worker Mobile App      │    │
│  │  (React + Vite)  │      │   (React Native/Expo)    │    │
│  └────────┬─────────┘      └────────────┬─────────────┘    │
└───────────┼──────────────────────────────┼──────────────────┘
            │          HTTPS/WSS          │
            ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API LAYER                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Node.js + Express API                  │    │
│  │    Auth │ Tasks │ Users │ Messages │ Notifications  │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│                      DATA LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  PostgreSQL  │  │    Redis     │  │  S3/Spaces   │       │
│  │  (Primary DB)│  │   (Cache)    │  │   (Images)   │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Manager Dashboard** | React + Vite + TypeScript | Fast dev cycle, type safety, huge ecosystem |
| **Worker Mobile App** | React Native + Expo | Single codebase for iOS/Android, OTA updates |
| **Backend API** | Node.js + Express | JavaScript everywhere, easy hiring, low cost |
| **Database** | PostgreSQL | Robust, free, excellent for relational data |
| **Cache/Realtime** | Redis | Session storage, pub/sub for live updates |
| **File Storage** | DigitalOcean Spaces / S3 | Cheap, scalable image storage |
| **Push Notifications** | Expo Push + Firebase | Free tier covers small teams |
| **Hosting** | Railway / Render / DO App Platform | Simple deployment, affordable scaling |

### Infrastructure Considerations

#### Multi-Tenancy Options

**Option 1: Schema Isolation (Recommended for shared infrastructure)**
- Single PostgreSQL database with multiple schemas
- Each organization gets dedicated schema (e.g., `turfsheet_banbury`)
- Shared infrastructure reduces costs
- Proven pattern from Taskboard project
- Cross-schema foreign keys possible for shared resources

**Option 2: Database Per Organization**
- Separate database for each golf course
- Complete data isolation
- Higher costs but simpler security model
- Better for large enterprise clients

**Option 3: Row-Level Security (RLS)**
- Single schema with RLS policies
- Filter all queries by `organization_id`
- Lowest cost, highest complexity
- Risk of data leakage if misconfigured

**Recommendation:** Start with Option 1 (schema isolation) for cost efficiency with proven data isolation.

#### Deployment Strategy

**Development:**
- Local PostgreSQL + Redis via Docker Compose
- Vite dev server for frontend (hot reload)
- Expo Go for mobile testing
- ngrok for webhook testing

**Staging:**
- Railway/Render free tier
- Supabase free tier (PostgreSQL)
- Upstash free tier (Redis)
- Test with real golf course data

**Production:**
- Railway/Render paid tier ($5-20/month)
- Supabase Pro ($25/month) or self-hosted PostgreSQL
- Upstash paid tier or self-hosted Redis
- DigitalOcean Spaces ($5/month for storage)
- CloudFlare CDN (free tier)

### Performance Considerations

#### Database Optimization
- Indexes on all foreign keys
- Composite indexes for common queries (e.g., `organization_id + scheduled_date`)
- Partial indexes for status-based queries
- Materialized views for reporting dashboards
- Connection pooling (PgBouncer)

#### Caching Strategy
- Redis for session storage
- Cache frequently accessed data (organization settings, user profiles)
- Cache invalidation on updates
- Real-time pub/sub for multi-user updates

#### Image Optimization
- Resize on upload (max 2048px width)
- WebP conversion for web display
- Thumbnail generation (200px, 400px)
- CDN for static assets
- Lazy loading in mobile app

#### Real-Time Features
- WebSocket connections for live updates
- Redis pub/sub for multi-server scaling
- Optimistic UI updates (update UI before API response)
- Conflict resolution for simultaneous edits

### Security Architecture

#### Authentication & Authorization
- **JWT Tokens:** Short-lived access tokens (15 min), long-lived refresh tokens (7 days)
- **Role-Based Access Control (RBAC):** Manager vs Worker permissions
- **Organization Scoping:** All queries filtered by `organization_id`
- **Token Rotation:** Refresh token rotation on use
- **Device Tracking:** Track active sessions per user

#### Data Security
- **Encryption at Rest:** Database-level encryption
- **Encryption in Transit:** HTTPS only, HSTS headers
- **Password Hashing:** bcrypt with salt rounds >= 12
- **Input Validation:** Zod schemas on all API inputs
- **SQL Injection Prevention:** Parameterized queries only
- **XSS Prevention:** Content Security Policy headers
- **CSRF Protection:** SameSite cookies, CSRF tokens

#### Rate Limiting
- **Authentication Endpoints:** 5 attempts per 15 minutes
- **API Endpoints:** 100 requests per minute per user
- **File Uploads:** 10 uploads per minute
- **Redis-based:** Distributed rate limiting

#### Audit Logging
- Log all authentication attempts
- Log all data modifications (who, what, when)
- Log equipment checkouts and returns
- Log chemical applications
- Retention: 2 years minimum for compliance
