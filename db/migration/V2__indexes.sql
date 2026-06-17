-- V2: Required indexes (spec §7.2)
CREATE INDEX idx_sm_product_id   ON stock_movements(product_id);
CREATE INDEX idx_sm_warehouse_id ON stock_movements(warehouse_id);
CREATE INDEX idx_sm_timestamp    ON stock_movements(timestamp DESC);
CREATE INDEX idx_sm_anomaly      ON stock_movements(anomaly_flag) WHERE anomaly_flag = TRUE;
CREATE INDEX idx_ae_movement_id  ON anomaly_events(movement_id);
CREATE INDEX idx_rt_user_id      ON refresh_tokens(user_id);
