# AI-Powered Smart Inventory Management System
## Software Requirements Specification

**Version:** 2.0 — June 2026
**Architecture:** Microservices MVP
**Target Users:** Warehouse Operators, Managers, Administrators

---

## Revision History

| Version | Date | Description |
|---------|------|-------------|
| 1.0 | June 2026 | Initial draft |
| 2.0 | June 2026 | Technical gap resolution: auth lifecycle, permission matrix, error contracts, pagination, anomaly model lifecycle, stock atomicity, LLM provider updated to OpenRouter (Qwen) |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [System Architecture](#2-system-architecture)
3. [Security & Authorization](#3-security--authorization)
4. [Functional Requirements](#4-functional-requirements)
5. [Non-Functional Requirements](#5-non-functional-requirements)
6. [API Specification](#6-api-specification)
7. [Database Design](#7-database-design)
8. [AI Service Specification](#8-ai-service-specification)
9. [Deployment](#9-deployment)
10. [Future Enhancements](#10-future-enhancements)
11. [Success Criteria](#11-success-criteria)

---

## 1. Introduction

### 1.1 Purpose

The AI-Powered Smart Inventory Management System is a warehouse inventory solution designed to manage stock movements, product catalogs, warehouse operations, and inventory monitoring. The system integrates AI capabilities to provide:

- Natural Language Database Querying (NL2SQL)
- Real-Time Anomaly Detection for suspicious stock movements
- Mobile barcode scanning operations
- Administrative dashboards and reporting

The platform is intended to improve operational efficiency, reduce inventory discrepancies, and enable non-technical users to retrieve warehouse insights using natural language.

### 1.2 Scope

**Inventory Management**
- Product catalog management
- Warehouse management
- Stock movement tracking
- Inventory level monitoring
- Low-stock alerts

**User Management**
- JWT-based authentication with refresh token support
- Role-based authorization with explicit permission matrix
- User activity tracking

**Mobile Operations**
- Barcode scanning
- Stock-in / stock-out registration
- Manual inventory adjustments

**AI Features**
- Natural language querying of inventory data via OpenRouter (Qwen)
- Automated anomaly detection (Isolation Forest)
- Inventory trend analysis foundation

---

## 2. System Architecture

### 2.1 Component Overview

| Component | Technology | Port | Responsibility |
|-----------|-----------|------|----------------|
| Flutter Mobile App | Flutter 3.x, Dio | — | Barcode scanning, stock movements, auth |
| React Web Portal | React 19, TypeScript, Vite, MUI | 3000 | Dashboards, AI chat, anomaly monitoring |
| Spring Boot API | Java 21, Spring Boot 3.x, Spring Security, JWT | 8080 | Auth, business logic, DB persistence, AI proxy |
| FastAPI AI Service | Python 3.12, FastAPI, LangChain, scikit-learn | 8000 | NL2SQL via OpenRouter, anomaly detection |
| PostgreSQL | PostgreSQL 16 | 5432 | Single source of truth |

### 2.2 Environment Variables

All secrets and environment-specific values must be injected via environment variables. No hardcoded values are permitted in source code. An `.env.example` file at the monorepo root documents all required variables.

#### Spring Boot Backend

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_URL` | PostgreSQL JDBC URL | `jdbc:postgresql://postgres:5432/inventory` |
| `DB_USERNAME` | Database user | `inventory_app` |
| `DB_PASSWORD` | Database password | *(secret)* |
| `JWT_SECRET` | HS256 signing key, min 256 bits | *(secret)* |
| `JWT_EXPIRY_MS` | Access token TTL in milliseconds | `900000` (15 min) |
| `JWT_REFRESH_EXPIRY_MS` | Refresh token TTL in milliseconds | `604800000` (7 days) |
| `AI_SERVICE_URL` | FastAPI base URL | `http://ai-service:8000` |
| `AI_SERVICE_TIMEOUT_MS` | Anomaly detection call timeout | `2000` |

#### FastAPI AI Service

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Read-only PostgreSQL DSN | `postgresql://readonly_user:pw@postgres:5432/inventory` |
| `OPENROUTER_API_KEY` | OpenRouter API key | *(secret)* |
| `OPENROUTER_MODEL` | Model identifier on OpenRouter | `qwen/qwen-2.5-72b-instruct` |
| `OPENROUTER_BASE_URL` | OpenRouter API base URL | `https://openrouter.ai/api/v1` |
| `MODEL_PATH` | Path to serialized Isolation Forest model | `/app/models/anomaly_model.pkl` |

> **Note on model selection:** The default model is `qwen/qwen-2.5-72b-instruct` via OpenRouter. This can be swapped for any other OpenRouter-hosted model by changing `OPENROUTER_MODEL` without code changes, since LangChain's `ChatOpenAI` class is used with the `openai_api_base` parameter pointing to OpenRouter's OpenAI-compatible endpoint.

### 2.3 Deployment Order

1. PostgreSQL — must be healthy before any other service starts
2. FastAPI AI Service — loads Isolation Forest model on startup
3. Spring Boot Backend — performs DB migration on startup (Flyway)
4. React Frontend — no startup dependency

---

## 3. Security & Authorization

### 3.1 JWT Token Specification

#### Access Token (JWT, HS256)

| Claim | Value |
|-------|-------|
| `sub` | User UUID (string) |
| `role` | `ADMIN` \| `MANAGER` \| `OPERATOR` |
| `iat` | Issued-at timestamp (epoch seconds) |
| `exp` | `iat + JWT_EXPIRY_MS / 1000` |

#### Refresh Token

A separate opaque refresh token (UUID v4) is issued alongside the access token. It is stored server-side in the `refresh_tokens` table with a foreign key to the user and an expiry timestamp. On refresh, the old token is invalidated (rotated). On logout, the token is deleted.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | Token value, opaque to client |
| `user_id` | UUID FK → users.id | |
| `expires_at` | TIMESTAMP | `iat + JWT_REFRESH_EXPIRY_MS` |
| `revoked_at` | TIMESTAMP NULL | Set on logout or rotation |

### 3.2 Auth Endpoints

| Method + Path | Description | Auth required |
|---------------|-------------|---------------|
| `POST /api/auth/login` | Authenticate, receive access + refresh tokens | No |
| `POST /api/auth/refresh` | Exchange refresh token for new token pair | No (token in body) |
| `POST /api/auth/logout` | Revoke refresh token | Bearer access token |

### 3.3 Role Permission Matrix

| Endpoint | ADMIN | MANAGER | OPERATOR |
|----------|-------|---------|----------|
| `POST /api/auth/login` | Yes | Yes | Yes |
| `POST /api/auth/refresh` | Yes | Yes | Yes |
| `POST /api/auth/logout` | Yes | Yes | Yes |
| `POST /api/products` | Yes | No | No |
| `PUT /api/products/{id}` | Yes | No | No |
| `DELETE /api/products/{id}` | Yes | No | No |
| `GET /api/products` | Yes | Yes | Yes |
| `GET /api/products/{id}` | Yes | Yes | Yes |
| `POST /api/warehouses` | Yes | No | No |
| `PUT /api/warehouses/{id}` | Yes | No | No |
| `GET /api/warehouses` | Yes | Yes | Yes |
| `POST /api/stocks/movements` | Yes | Yes | Yes |
| `GET /api/stocks/movements` | Yes | Yes | No |
| `GET /api/stocks/low-stock` | Yes | Yes | No |
| `POST /api/ai/chat` | Yes | Yes | No |
| `GET /api/anomalies` | Yes | Yes | No |
| `PATCH /api/anomalies/{id}/review` | Yes | Yes | No |
| `GET /api/users` | Yes | No | No |
| `POST /api/users` | Yes | No | No |

---

## 4. Functional Requirements

### FR-01 User Authentication

The system shall authenticate users via username/password and issue a JWT access token plus an opaque refresh token.

**Acceptance Criteria**
- Access token and refresh token issued together on successful login
- Invalid credentials return HTTP 401 with standard error body
- Expired access token returns HTTP 401; client must call `/api/auth/refresh`
- Refresh token rotation: each use invalidates the old token and issues a new pair
- Logout revokes the refresh token; subsequent refresh attempts return HTTP 401

---

### FR-02 Product Management

Administrators shall create, update, view, and delete products.

**Product Attributes**

| Field | Type | Constraints |
|-------|------|-------------|
| `id` | UUID | PK, auto-generated |
| `sku` | VARCHAR(100) | UNIQUE NOT NULL |
| `name` | VARCHAR(255) | NOT NULL |
| `description` | TEXT | NULLABLE |
| `min_stock` | INTEGER | NOT NULL, >= 0 |
| `current_stock` | INTEGER | NOT NULL, >= 0 (enforced at application level) |
| `created_at` | TIMESTAMP | NOT NULL, default `now()` |
| `updated_at` | TIMESTAMP | NOT NULL, updated on every write |

**Acceptance Criteria**
- Duplicate SKU returns HTTP 409
- `current_stock` can never go below zero; violation returns HTTP 422
- Deleting a product with existing stock movements returns HTTP 409

---

### FR-03 Warehouse Management

Administrators shall manage warehouse locations.

| Field | Type | Constraints |
|-------|------|-------------|
| `id` | UUID | PK, auto-generated |
| `name` | VARCHAR(255) | NOT NULL |
| `location` | VARCHAR(255) | NULLABLE |
| `created_at` | TIMESTAMP | NOT NULL, default `now()` |

---

### FR-04 Stock Movement Registration

Operators shall record inventory movements. Stock levels must be updated atomically within the same database transaction as the movement record.

**Movement Types**

| Type | Validation Rule | Stock Effect |
|------|----------------|--------------|
| `IN` | `quantity > 0` | `current_stock += quantity` |
| `OUT` | `quantity > 0 AND current_stock >= quantity` | `current_stock -= quantity` |
| `ADJUSTMENT` | `quantity != 0` (positive or negative) | `current_stock += quantity` |

**Atomicity Requirement**

The stock movement `INSERT` and the `products.current_stock` `UPDATE` must occur within a single database transaction using `SELECT FOR UPDATE` on the product row to prevent race conditions. If either operation fails, the entire transaction rolls back.

**AI Anomaly Check — Failure Behaviour**

The anomaly detection call to FastAPI is performed asynchronously after the movement is committed. If the AI service is unavailable or times out (threshold: `AI_SERVICE_TIMEOUT_MS`), the movement is saved with `anomaly_flag = false` and an internal warning is logged. A movement is never rejected due to AI service unavailability.

**Process Flow**

1. Client sends `POST /api/stocks/movements`
2. Spring Boot validates the request (movement type rules above)
3. Transaction begins: `INSERT stock_movements` + `UPDATE products.current_stock`
4. Transaction commits
5. Spring Boot asynchronously calls `POST /detect-anomaly` on FastAPI
6. On success: `UPDATE stock_movements SET anomaly_flag = true WHERE id = ?` (if `is_anomaly`)
7. On AI timeout/failure: log warning, leave `anomaly_flag = false`

---

### FR-05 Inventory Monitoring

Managers shall view current inventory levels, low-stock products, movement history, and warehouse-level reports. All list endpoints support pagination (see Section 6.2).

---

### FR-06 AI Chat Interface

Users shall query warehouse data using natural language. Requests flow from Spring Boot to the FastAPI AI service, where a LangChain agent backed by OpenRouter (Qwen) translates the natural language prompt into SQL, executes it via a read-only database connection, and returns structured results.

**LLM Integration**

The LangChain agent uses `ChatOpenAI` configured with:

```python
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(
    model=os.environ["OPENROUTER_MODEL"],          # e.g. qwen/qwen-2.5-72b-instruct
    openai_api_key=os.environ["OPENROUTER_API_KEY"],
    openai_api_base=os.environ["OPENROUTER_BASE_URL"],  # https://openrouter.ai/api/v1
    temperature=0,
    extra_headers={
        "HTTP-Referer": "https://warehouse-pfe.local",  # required by OpenRouter
        "X-Title": "Warehouse Inventory System",
    }
)
```

**NL2SQL Schema Context**

The LangChain agent is initialized with a system prompt that includes the full DDL of all tables (`users`, `products`, `warehouses`, `stock_movements`, `anomaly_events`). This schema context is injected once at agent startup and refreshed on service restart. The agent is explicitly instructed to generate only `SELECT` statements and to refuse any query that would modify data.

**SQL Safety Constraints**
- Only `SELECT` statements are permitted; any DDL or DML triggers HTTP 422 before execution
- Query execution uses the dedicated `readonly_user` PostgreSQL account (SELECT-only grants)
- Maximum query execution time: 8 seconds
- Result set capped at 500 rows

**Example Queries**
```
Show products below minimum stock.
Which warehouse had the most stock movements this week?
List products with inventory below 10 units.
How many OUT movements were flagged as anomalies last month?
```

---

### FR-07 Anomaly Detection

The system shall detect unusual inventory activities using a pre-trained Isolation Forest model.

**Model Lifecycle**

| Stage | Description |
|-------|-------------|
| Initial training | Model is pre-trained offline on synthetic data representing realistic stock movement distributions before first deployment. The serialized model (`.pkl`) is baked into the Docker image at `MODEL_PATH`. |
| Retraining trigger | When `anomaly_events` accumulates >= 500 reviewed records, retraining can be triggered manually via `POST /admin/retrain`. Automated retraining is a future enhancement. |
| Model versioning | Active model version is logged at service startup. Retraining produces a new file; the old file is retained for rollback. |

**Input Features**

| Feature | Type | Preprocessing |
|---------|------|---------------|
| `quantity` | Float | None |
| `movement_type` | Categorical | Label-encoded: IN=0, OUT=1, ADJUSTMENT=2 |
| `hour_of_day` | Integer (0–23) | None |
| `product_avg_daily_volume` | Float | Mean daily quantity for this product over last 30 days; default 0 for new products |
| `quantity_zscore` | Float | `(quantity - product_avg_daily_volume) / std`; captures unusually large movements |

> `product_id` (UUID) is not used directly as a model feature. Product-level context is captured through `product_avg_daily_volume` and `quantity_zscore`.

**Output**

```json
{
  "is_anomaly": true,
  "confidence_score": 0.89,
  "model_version": "1.0.0"
}
```

**Dashboard Actions**
- Anomaly alert shown on React dashboard for any movement with `anomaly_flag = true`
- MANAGER and ADMIN can review anomalies and mark outcome (`TRUE_POSITIVE` / `FALSE_POSITIVE`)
- Review outcome stored in `anomaly_events.review_outcome` for future model retraining

---

## 5. Non-Functional Requirements

### NFR-01 Performance

| Operation | P95 Target | Measurement Point |
|-----------|-----------|-------------------|
| Login | < 2 s | Server-side |
| Product creation | < 2 s | Server-side |
| Stock movement registration | < 3 s | Server-side (anomaly call is async — not included) |
| AI chat response (NL2SQL + query) | < 10 s | End-to-end (includes OpenRouter latency) |
| Anomaly detection (async) | < 1 s | FastAPI endpoint |
| Inventory list (page size 50) | < 1 s | Server-side |

### NFR-02 Scalability

- 100+ concurrent users (horizontal Spring Boot scaling via Docker replicas)
- 1 million stock movement records — all list queries must use indexed columns
- Multiple warehouse locations
- Required indexes: `stock_movements(product_id)`, `stock_movements(warehouse_id)`, `stock_movements(timestamp DESC)`, `stock_movements(anomaly_flag)` (partial, where true), `anomaly_events(movement_id)`

### NFR-03 Availability

Target uptime: 99.5% (excluding planned maintenance). Health check endpoints must be exposed on all services for Docker Compose `healthcheck` directives.

| Service | Health endpoint |
|---------|----------------|
| Spring Boot | `GET /actuator/health` |
| FastAPI | `GET /health` |
| PostgreSQL | `pg_isready` |

### NFR-04 Security

- Passwords hashed with BCrypt (cost factor >= 12)
- JWT secrets minimum 256 bits, managed via environment variables — never committed to source control
- `OPENROUTER_API_KEY` treated as a secret; never logged or returned in responses
- All inter-service communication on the Docker internal network; only mapped ports are externally accessible
- Read-only PostgreSQL user for AI service with SELECT-only grants
- HTTPS/TLS required in staging and production environments

### NFR-05 Maintainability

- Database schema changes managed via Flyway migrations (`db/migration/`)
- All services containerized; `docker-compose.yml` is the single entrypoint for local development
- Monorepo structure with one sub-directory per service

---

## 6. API Specification

### 6.1 Standard Error Response

All error responses follow this structure regardless of endpoint or error type:

```json
{
  "error": "PRODUCT_NOT_FOUND",
  "message": "No product with id 550e8400-e29b-...",
  "status": 404,
  "timestamp": "2026-06-17T21:00:00Z",
  "path": "/api/products/550e8400-e29b-..."
}
```

Validation errors (HTTP 422) include a `violations` array:

```json
{
  "error": "VALIDATION_FAILED",
  "message": "Request validation failed",
  "status": 422,
  "timestamp": "2026-06-17T21:00:00Z",
  "path": "/api/stocks/movements",
  "violations": [
    { "field": "quantity", "message": "must be greater than 0" }
  ]
}
```

**Standard Error Codes**

| HTTP Status | Error Code | Condition |
|-------------|-----------|-----------|
| 400 | `BAD_REQUEST` | Malformed JSON or missing required field |
| 401 | `UNAUTHORIZED` | Missing, invalid, or expired access token |
| 403 | `FORBIDDEN` | Valid token but insufficient role |
| 404 | `NOT_FOUND` | Resource does not exist |
| 409 | `CONFLICT` | Duplicate SKU, or deleting a product with existing movements |
| 422 | `VALIDATION_FAILED` | Business rule violation (e.g. insufficient stock) |
| 503 | `SERVICE_UNAVAILABLE` | AI service unreachable (synchronous AI endpoints only) |

---

### 6.2 Pagination

All list endpoints accept these query parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | Integer | `0` | Zero-based page number |
| `size` | Integer | `20` | Items per page (max 100) |
| `sort` | String | `created_at,desc` | Field and direction, e.g. `name,asc` |

All paginated responses use this envelope:

```json
{
  "data": [ ... ],
  "page": 0,
  "size": 20,
  "total_elements": 1543,
  "total_pages": 78
}
```

---

### 6.3 Authentication Endpoints

#### POST /api/auth/login

```json
// Request
{
  "username": "admin_user",
  "password": "securepassword123"
}

// Response 200
{
  "access_token": "eyJhbGci...",
  "refresh_token": "550e8400-e29b-41d4-a716-446655440000",
  "token_type": "Bearer",
  "expires_in": 900,
  "role": "ADMIN"
}
```

#### POST /api/auth/refresh

```json
// Request
{ "refresh_token": "550e8400-e29b-41d4-a716-446655440000" }

// Response 200 — same structure as login
```

#### POST /api/auth/logout

Header: `Authorization: Bearer {access_token}`

```json
// Request
{ "refresh_token": "550e8400-e29b-41d4-a716-446655440000" }

// Response 204 No Content
```

---

### 6.4 Product Endpoints

#### POST /api/products  `[ADMIN]`

```json
// Request
{
  "sku": "ELEC-001",
  "name": "Wireless Mouse",
  "description": "Ergonomic wireless mouse with USB receiver",
  "min_stock": 20,
  "current_stock": 150
}

// Response 201
{
  "id": "uuid",
  "sku": "ELEC-001",
  "name": "Wireless Mouse",
  "description": "Ergonomic wireless mouse with USB receiver",
  "min_stock": 20,
  "current_stock": 150,
  "created_at": "2026-06-17T21:00:00Z"
}
```

#### GET /api/products  `[ADMIN, MANAGER, OPERATOR]`

Paginated. Optional filter: `?low_stock=true` returns only products where `current_stock < min_stock`.

#### PUT /api/products/{id}  `[ADMIN]`

Partial update (PATCH semantics). Returns updated product (200). `current_stock` cannot be set via this endpoint — use stock movements instead.

#### DELETE /api/products/{id}  `[ADMIN]`

Returns 204. Returns 409 if the product has existing `stock_movements` records.

---

### 6.5 Warehouse Endpoints

#### POST /api/warehouses  `[ADMIN]`

```json
// Request
{ "name": "Warehouse A", "location": "Casablanca, Zone 3" }

// Response 201
{ "id": "uuid", "name": "Warehouse A", "location": "Casablanca, Zone 3", "created_at": "..." }
```

#### GET /api/warehouses  `[ADMIN, MANAGER, OPERATOR]`

Paginated. Optional filter: `?name=`.

---

### 6.6 Stock Movement Endpoints

#### POST /api/stocks/movements  `[ADMIN, MANAGER, OPERATOR]`

```json
// Request
{
  "product_id": "uuid",
  "warehouse_id": "uuid",
  "quantity": 50,
  "type": "OUT",
  "notes": "Weekly dispatch to client ABC"
}

// Response 201
{
  "id": "uuid",
  "product_id": "uuid",
  "warehouse_id": "uuid",
  "user_id": "uuid",
  "quantity": 50,
  "type": "OUT",
  "timestamp": "2026-06-17T21:02:20Z",
  "anomaly_flag": false,
  "notes": "Weekly dispatch to client ABC"
}
```

> `anomaly_flag` is always `false` at creation time. It is updated asynchronously after the anomaly detection call resolves.

#### GET /api/stocks/movements  `[ADMIN, MANAGER]`

Paginated. Optional filters: `?product_id=&warehouse_id=&type=OUT&anomaly_only=true&from=2026-01-01&to=2026-06-30`

#### GET /api/stocks/low-stock  `[ADMIN, MANAGER]`

Paginated list of products where `current_stock < min_stock`.

---

### 6.7 AI Chat Endpoint

#### POST /api/ai/chat  `[ADMIN, MANAGER]`

```json
// Request
{ "query": "Show me products with stock below 10 units." }

// Response 200
{
  "answer": "Here are the products with stock below 10 units:",
  "sql_executed": "SELECT sku, name, current_stock FROM products WHERE current_stock < 10",
  "data": [
    { "sku": "ELEC-009", "name": "Mechanical Keyboard", "current_stock": 5 }
  ],
  "row_count": 1,
  "truncated": false
}
```

---

### 6.8 Anomaly Endpoints

#### GET /api/anomalies  `[ADMIN, MANAGER]`

Paginated. Returns movements where `anomaly_flag = true`, joined with their `anomaly_events` record. Optional filter: `?reviewed=false`.

#### PATCH /api/anomalies/{event_id}/review  `[ADMIN, MANAGER]`

```json
// Request
{ "outcome": "TRUE_POSITIVE" }

// Response 200 — updated anomaly_events record
```

---

## 7. Database Design

### 7.1 Full Schema DDL

```sql
-- Users
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username      VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN','MANAGER','OPERATOR')),
  created_at    TIMESTAMP NOT NULL DEFAULT now()
);

-- Refresh tokens
CREATE TABLE refresh_tokens (
  id          UUID PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at  TIMESTAMP NOT NULL,
  revoked_at  TIMESTAMP
);

-- Products
CREATE TABLE products (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku           VARCHAR(100) UNIQUE NOT NULL,
  name          VARCHAR(255) NOT NULL,
  description   TEXT,
  min_stock     INTEGER NOT NULL CHECK (min_stock >= 0),
  current_stock INTEGER NOT NULL CHECK (current_stock >= 0),
  created_at    TIMESTAMP NOT NULL DEFAULT now(),
  updated_at    TIMESTAMP NOT NULL DEFAULT now()
);

-- Warehouses
CREATE TABLE warehouses (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(255) NOT NULL,
  location   VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Stock movements
CREATE TABLE stock_movements (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   UUID NOT NULL REFERENCES products(id),
  warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  user_id      UUID NOT NULL REFERENCES users(id),
  quantity     INTEGER NOT NULL,
  type         VARCHAR(15) NOT NULL CHECK (type IN ('IN','OUT','ADJUSTMENT')),
  notes        TEXT,
  timestamp    TIMESTAMP NOT NULL DEFAULT now(),
  anomaly_flag BOOLEAN NOT NULL DEFAULT FALSE
);

-- Anomaly events
CREATE TABLE anomaly_events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movement_id      UUID NOT NULL REFERENCES stock_movements(id),
  confidence_score DECIMAL(5,4) NOT NULL,
  model_version    VARCHAR(20) NOT NULL,
  reviewed_by      UUID REFERENCES users(id),
  review_outcome   VARCHAR(20) CHECK (review_outcome IN ('TRUE_POSITIVE','FALSE_POSITIVE')),
  created_at       TIMESTAMP NOT NULL DEFAULT now()
);
```

### 7.2 Required Indexes

```sql
CREATE INDEX idx_sm_product_id   ON stock_movements(product_id);
CREATE INDEX idx_sm_warehouse_id ON stock_movements(warehouse_id);
CREATE INDEX idx_sm_timestamp    ON stock_movements(timestamp DESC);
CREATE INDEX idx_sm_anomaly      ON stock_movements(anomaly_flag) WHERE anomaly_flag = TRUE;
CREATE INDEX idx_ae_movement_id  ON anomaly_events(movement_id);
CREATE INDEX idx_rt_user_id      ON refresh_tokens(user_id);
```

### 7.3 Read-Only Database User

```sql
CREATE USER readonly_user WITH PASSWORD '...';
GRANT CONNECT ON DATABASE inventory TO readonly_user;
GRANT USAGE ON SCHEMA public TO readonly_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO readonly_user;
```

---

## 8. AI Service Specification

### 8.1 LLM Configuration

The NL2SQL feature uses the OpenRouter API with Qwen as the backing model. OpenRouter exposes an OpenAI-compatible endpoint, so LangChain's `ChatOpenAI` class is used directly with no custom provider code required.

```python
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(
    model=os.environ["OPENROUTER_MODEL"],           # qwen/qwen-2.5-72b-instruct
    openai_api_key=os.environ["OPENROUTER_API_KEY"],
    openai_api_base=os.environ["OPENROUTER_BASE_URL"],
    temperature=0,
    extra_headers={
        "HTTP-Referer": "https://warehouse-pfe.local",
        "X-Title": "Warehouse Inventory System",
    }
)
```

The agent system prompt must include:
1. The full DDL of all tables (injected at startup)
2. An instruction to generate only `SELECT` statements
3. An instruction to return results as structured JSON, not prose

### 8.2 POST /detect-anomaly

Called asynchronously by Spring Boot after a movement is committed.

```json
// Request
{
  "product_id": "uuid",
  "quantity": 50,
  "type": "OUT",
  "hour_of_day": 2,
  "product_avg_daily_volume": 120.5,
  "quantity_zscore": 3.8
}

// Response 200
{
  "is_anomaly": true,
  "confidence_score": 0.89,
  "model_version": "1.0.0"
}
```

### 8.3 POST /generate-query

Called by Spring Boot when an AI chat request arrives.

```json
// Request
{
  "prompt": "Show products below minimum stock.",
  "session_id": "uuid"
}

// Response 200
{
  "sql_executed": "SELECT sku, name, current_stock, min_stock FROM products WHERE current_stock < min_stock",
  "results": [
    { "sku": "ELEC-009", "name": "Keyboard", "current_stock": 5, "min_stock": 20 }
  ],
  "row_count": 1,
  "truncated": false
}

// Response 422 — generated SQL is not a SELECT
{ "error": "UNSAFE_QUERY", "message": "Generated SQL is not a SELECT statement" }
```

### 8.4 GET /health

```json
// Response 200 — service ready
{ "status": "ok", "model_version": "1.0.0" }

// Response 503 — model not loaded
{ "status": "unavailable", "reason": "Isolation Forest model not loaded" }
```

---

## 9. Deployment

### 9.1 Docker Services

| Service | Image | Port (host:container) | Depends on |
|---------|-------|-----------------------|------------|
| `postgres` | `postgres:16` | `5432:5432` | — |
| `ai-service` | `warehouse-pfe/ai:latest` | `8000:8000` | `postgres` (healthy) |
| `backend` | `warehouse-pfe/backend:latest` | `8080:8080` | `postgres` (healthy), `ai-service` (healthy) |
| `frontend` | `warehouse-pfe/frontend:latest` | `3000:3000` | `backend` |

### 9.2 Project Structure

```
warehouse/
├── docker-compose.yml
├── .env.example                  # template for all env vars
├── db/
│   └── migration/                # Flyway versioned SQL files
├── backend/
│   ├── src/
│   └── Dockerfile
├── ai-core/
│   ├── models/                   # serialized .pkl files
│   ├── src/
│   └── Dockerfile
├── frontend/
│   ├── src/
│   └── Dockerfile
└── mobile/
    └── lib/
```

---

## 10. Future Enhancements

1. Predictive inventory forecasting using time-series models (Prophet, LSTM)
2. Multi-warehouse stock transfers with transfer order workflow
3. Real-time notifications via WebSockets (anomaly alerts, low-stock alerts)
4. Supplier and purchase order management
5. OCR-based inventory intake (scan delivery notes)
6. AI-powered replenishment recommendations using Qwen via OpenRouter
7. Audit logs and compliance reporting
8. Advanced analytics dashboards
9. Automated anomaly model retraining pipeline
10. Multi-tenant support

---

## 11. Success Criteria

The MVP is considered successful when all of the following are met:

- Users can authenticate, refresh sessions, and log out securely
- Products and warehouses are managed by authorized roles only
- Stock movements are recorded atomically; `current_stock` is always consistent with movement history
- Barcode scanning in the mobile app creates valid movement records
- AI chat answers natural language inventory questions via OpenRouter (Qwen) using generated SQL
- Anomaly detection runs asynchronously and does not block movement registration
- Anomaly events are reviewable by managers via the dashboard
- All services start and pass health checks via a single `docker-compose up`
- PostgreSQL is the single source of truth; no derived state exists outside a transaction
