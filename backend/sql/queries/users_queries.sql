-- =============================================
-- Requêtes SQL dédiées (MS SQL Server / SSMS) : Users
-- Format : -- name: nom_requete
-- Placeholders : ?
-- =============================================

-- name: get_user_by_email
SELECT id, full_name, email, password_hash, role, department, is_active,
       created_at, updated_at
FROM users
WHERE email = ?;

-- name: get_user_by_id
SELECT id, full_name, email, role, department, is_active,
       created_at, updated_at
FROM users
WHERE id = ?;

-- name: create_user
INSERT INTO users (full_name, email, password_hash, role, department)
OUTPUT INSERTED.id
VALUES (?, ?, ?, ?, ?);

-- name: get_all_users
SELECT id, full_name, email, role, department, is_active,
       created_at, updated_at
FROM users
ORDER BY full_name;

-- name: update_user_status
UPDATE users SET is_active = ?, updated_at = GETDATE()
WHERE id = ?;

-- name: check_email_exists
SELECT COUNT(*) as cnt FROM users WHERE email = ?;

-- name: get_user_with_password_by_id
SELECT id, full_name, email, password_hash, role, department, is_active,
       created_at, updated_at
FROM users
WHERE id = ?;

-- name: update_user_profile
UPDATE users SET full_name = ?, department = ?, updated_at = GETDATE()
WHERE id = ?;

-- name: update_user_password
UPDATE users SET password_hash = ?, updated_at = GETDATE()
WHERE id = ?;
