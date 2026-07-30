# RoomBae 1M+ User Scale Enterprise Architecture & Threat Model

## 1. System Architecture & Topology

```
                          [ Global Cloudflare Edge / WAF ]
                                        │
                                [ NGINX Load Balancer ]
                             (L7 IP Hash Sticky Sessions)
                                        │
            ┌───────────────────────────┼───────────────────────────┐
            ▼                           ▼                           ▼
  [ Node.js Cluster Worker 1 ] [ Node.js Cluster Worker 2 ] [ Node.js Cluster Worker N ]
    ├── REST API v1              ├── REST API v1              ├── REST API v1
    ├── Apollo GraphQL           ├── Apollo GraphQL           ├── Apollo GraphQL
    ├── SOAP ERP                 ├── SOAP ERP                 ├── SOAP ERP
    └── Socket.IO WS             └── Socket.IO WS             └── Socket.IO WS
            │                           │                           │
            └───────────────────────────┼───────────────────────────┘
                                        │
             ┌──────────────────────────┴──────────────────────────┐
             ▼                                                     ▼
  [ Redis Cluster Pub/Sub ]                              [ MongoDB Atlas Cluster ]
   ├── Distributed Locks (Redlock)                         ├── Replicas (Primary / Secondary)
   ├── Sliding Window Rate Limits                          ├── Compound & TTL Indexes
   └── Socket.IO Redis Adapter                             └── Aggregation Pipelines
```

---

## 2. Microservice Decomposition Strategy

The architecture is split into 12 domain-bounded context modules designed for seamless extraction into standalone microservices:

| Module | Primary Responsibility | Exposed Interfaces | Caching Strategy |
|---|---|---|---|
| **Auth** | User identity, JWT rotation, OTP, RBAC | REST, GraphQL | Redis Token Revocation List |
| **Properties** | PG listings, room grid, geo-search | REST, GraphQL | Redis Public Search Cache (TTL 300s) |
| **Residents** | Directory, KYC, gate pass, visitor pass | REST, GraphQL | Redis Resident Profile Cache |
| **Agreements** | Rental contracts, digital signatures | REST, GraphQL | Local S3 + HMAC Integrity Signatures |
| **Billing** | Invoices, Razorpay webhooks, SOAP ERP | REST, GraphQL, SOAP | Database Ledger + Webhook Idempotency |
| **Complaints** | Support ticketing, status transitions | REST, GraphQL, Sockets | Real-time WebSocket Broadcaster |
| **Notifications**| Email, SMS, Push notification queue | Events / Queue | BullMQ Async Processing |
| **Meals** | Meal plans, daily skip toggles | REST, GraphQL | Daily Redis Skip Roster |
| **Analytics** | MRR, occupancy rate, financial reports | REST, GraphQL | Worker Thread CPU Offloading |
| **Search** | Geo-spatial Haversine distance search | REST | Geohash Redis Indexing |
| **Media** | Safe image upload, MIME validation | REST | CDN + Storage Buckets |
| **Sockets** | Real-time presence & multi-room sync | WebSockets | Redis Adapter Multi-Instance Sync |

---

## 3. Threat Model (STRIDE Framework)

| Threat Category | Potential Risk | Mitigation in Architecture |
|---|---|---|
| **Spoofing** | JWT token theft or forged requests | Short-lived JWT access tokens + Refresh token rotation + `x-correlation-id` tracing |
| **Tampering** | Data modification in transit or storage | TLS 1.3 enforced + AES-256-GCM field encryption + HMAC SHA-256 signatures |
| **Repudiation** | Unverified agreement signatures or actions | `logAudit()` audit logger middleware recording user ID, action, IP, timestamp |
| **Information Disclosure**| Database error leaks or PII exposure | Global error masking, friendly user error messages, AES-256 PII encryption |
| **Denial of Service** | API request floods or slowloris attacks | NGINX rate limit zones + sliding window rate limiters + GraphQL depth limits |
| **Elevation of Privilege**| Unauthorized admin/owner endpoint access | Layered `authenticate` + `authorize(Role...)` RBAC middleware on all routes |

---

## 4. Operational & Observability Endpoints

- **`/health`**: Returns real-time DB latency, memory usage, service readiness, and uptime.
- **`/ready`**: Kubernetes readiness probe verifying container availability.
- **`/live`**: Kubernetes liveness probe checking container process health.
- **`/metrics`**: Prometheus metrics endpoint scraping memory, active workers, and process metrics.
- **`/api/docs`**: Interactive OpenAPI 3.0 Swagger UI documentation.
