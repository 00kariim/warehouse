-- V1: Initial schema
-- Users
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username      VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(20)  NOT NULL CHECK (role IN ('ADMIN','MANAGER','OPERATOR')),
    created_at    TIMESTAMP    NOT NULL DEFAULT now()
);

-- Refresh tokens
CREATE TABLE refresh_tokens (
    id          UUID      PRIMARY KEY,
    user_id     UUID      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at  TIMESTAMP NOT NULL,
    revoked_at  TIMESTAMP
);

-- Products
CREATE TABLE products (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    sku           VARCHAR(100) UNIQUE NOT NULL,
    name          VARCHAR(255) NOT NULL,
    description   TEXT,
    min_stock     INTEGER      NOT NULL CHECK (min_stock >= 0),
    current_stock INTEGER      NOT NULL CHECK (current_stock >= 0),
    created_at    TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at    TIMESTAMP    NOT NULL DEFAULT now()
);

-- Warehouses
CREATE TABLE warehouses (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name       VARCHAR(255) NOT NULL,
    location   VARCHAR(255),
    created_at TIMESTAMP    NOT NULL DEFAULT now()
);

-- Stock movements
CREATE TABLE stock_movements (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id   UUID        NOT NULL REFERENCES products(id),
    warehouse_id UUID        NOT NULL REFERENCES warehouses(id),
    user_id      UUID        NOT NULL REFERENCES users(id),
    quantity     INTEGER     NOT NULL,
    type         VARCHAR(15) NOT NULL CHECK (type IN ('IN','OUT','ADJUSTMENT')),
    notes        TEXT,
    timestamp    TIMESTAMP   NOT NULL DEFAULT now(),
    anomaly_flag BOOLEAN     NOT NULL DEFAULT FALSE
);

-- Anomaly events
CREATE TABLE anomaly_events (
    id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    movement_id      UUID         NOT NULL REFERENCES stock_movements(id),
    confidence_score DECIMAL(5,4) NOT NULL,
    model_version    VARCHAR(20)  NOT NULL,
    reviewed_by      UUID REFERENCES users(id),
    review_outcome   VARCHAR(20) CHECK (review_outcome IN ('TRUE_POSITIVE','FALSE_POSITIVE')),
    created_at       TIMESTAMP    NOT NULL DEFAULT now()
);
