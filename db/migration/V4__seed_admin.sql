-- V4: Seed admin user
-- Password: admin123 (BCrypt cost 12)
-- Change this before production!
INSERT INTO users (id, username, password_hash, role, created_at)
VALUES (
    gen_random_uuid(),
    'admin',
    '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- admin123
    'ADMIN',
    now()
)
ON CONFLICT (username) DO NOTHING;
