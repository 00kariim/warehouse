-- V4: Seed test data — users, warehouses, products, stock movements
-- All passwords: 123456  (BCrypt cost 12)
-- ⚠ Change before production!

-- ─── Users ────────────────────────────────────────────────────────────────────
INSERT INTO users (id, username, password_hash, role, created_at) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'admin@admin.com',    '$2a$12$Ivv/vvNH.hILxhtwAu1/0OcMseoO2kMwwvAe9ew/08Qbj.s5LrVIO', 'ADMIN',    now()),
  ('a0000000-0000-0000-0000-000000000002', 'manager',  '$2a$12$Ivv/vvNH.hILxhtwAu1/0OcMseoO2kMwwvAe9ew/08Qbj.s5LrVIO', 'MANAGER',  now()),
  ('a0000000-0000-0000-0000-000000000003', 'operator', '$2a$12$Ivv/vvNH.hILxhtwAu1/0OcMseoO2kMwwvAe9ew/08Qbj.s5LrVIO', 'OPERATOR', now())
ON CONFLICT (username) DO NOTHING;

-- ─── Warehouses ───────────────────────────────────────────────────────────────
INSERT INTO warehouses (id, name, location, created_at) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'Main Warehouse',  'Casablanca, Zone Industrielle', now()),
  ('b0000000-0000-0000-0000-000000000002', 'North Depot',     'Tanger, Zone Franche',         now()),
  ('b0000000-0000-0000-0000-000000000003', 'South Depot',     'Marrakech, Sidi Ghanem',       now())
ON CONFLICT DO NOTHING;

-- ─── Products ─────────────────────────────────────────────────────────────────
INSERT INTO products (id, sku, name, description, min_stock, current_stock, created_at, updated_at) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'ELEC-001', 'Wireless Keyboard',    'Bluetooth wireless keyboard, compact layout',     20, 150, now(), now()),
  ('c0000000-0000-0000-0000-000000000002', 'ELEC-002', 'USB-C Hub',            '7-port USB-C hub with HDMI and ethernet',          15,  42, now(), now()),
  ('c0000000-0000-0000-0000-000000000003', 'ELEC-003', 'LED Monitor 27"',      '4K IPS monitor, 27 inch, 60Hz',                   10,  35, now(), now()),
  ('c0000000-0000-0000-0000-000000000004', 'ELEC-004', 'Webcam 1080p',         'Full HD webcam with autofocus and microphone',     25,  88, now(), now()),
  ('c0000000-0000-0000-0000-000000000005', 'ELEC-005', 'Mechanical Mouse',     'RGB gaming mouse, 16000 DPI',                     30, 210, now(), now()),
  ('c0000000-0000-0000-0000-000000000006', 'FURN-001', 'Standing Desk',        'Electric sit-stand desk, 120x60cm',                 5,  18, now(), now()),
  ('c0000000-0000-0000-0000-000000000007', 'FURN-002', 'Ergonomic Chair',      'Mesh-back office chair with lumbar support',        8,  12, now(), now()),
  ('c0000000-0000-0000-0000-000000000008', 'PACK-001', 'Cardboard Box (L)',    'Large corrugated box, 60x40x40cm',                50,   5, now(), now()),
  ('c0000000-0000-0000-0000-000000000009', 'PACK-002', 'Bubble Wrap Roll',     '100m roll, 30cm width',                           40,   3, now(), now()),
  ('c0000000-0000-0000-0000-000000000010', 'SAFE-001', 'Safety Goggles',       'Anti-fog polycarbonate safety glasses',            60,  45, now(), now())
ON CONFLICT (sku) DO NOTHING;

-- ─── Stock Movements ──────────────────────────────────────────────────────────
-- Some realistic movement history
INSERT INTO stock_movements (id, product_id, warehouse_id, user_id, quantity, type, notes, timestamp, anomaly_flag) VALUES
  -- Receiving stock
  (gen_random_uuid(), 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', 200, 'IN',         'Initial stock from supplier',    now() - interval '7 days', false),
  (gen_random_uuid(), 'c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003',  60, 'IN',         'PO #1042 received',              now() - interval '6 days', false),
  (gen_random_uuid(), 'c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000003',  50, 'IN',         'Transfer from supplier',         now() - interval '5 days', false),
  (gen_random_uuid(), 'c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', 300, 'IN',         'Bulk order received',            now() - interval '5 days', false),
  -- Dispatching
  (gen_random_uuid(), 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003',  50, 'OUT',        'Client order #A-2210',           now() - interval '4 days', false),
  (gen_random_uuid(), 'c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003',  18, 'OUT',        'Client order #A-2211',           now() - interval '3 days', false),
  (gen_random_uuid(), 'c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003',  90, 'OUT',        'Retail batch shipment',          now() - interval '2 days', false),
  -- Adjustment
  (gen_random_uuid(), 'c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', -15, 'ADJUSTMENT', 'Inventory audit correction',     now() - interval '1 day',  false),
  -- Suspicious movement (will be flagged)
  (gen_random_uuid(), 'c0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 995, 'OUT',        'Unusually large dispatch',       now() - interval '12 hours', true),
  (gen_random_uuid(), 'c0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', 500, 'OUT',        'Unverified bulk removal',        now() - interval '6 hours',  true);

-- ─── Anomaly Events (for the flagged movements above) ─────────────────────────
-- We reference the last two movements by their anomaly_flag; safer to use a subquery
INSERT INTO anomaly_events (id, movement_id, confidence_score, model_version, created_at)
SELECT gen_random_uuid(), sm.id, 0.9200, '1.0.0', sm.timestamp + interval '2 seconds'
FROM stock_movements sm
WHERE sm.anomaly_flag = true
  AND sm.notes IN ('Unusually large dispatch', 'Unverified bulk removal')
ON CONFLICT DO NOTHING;
