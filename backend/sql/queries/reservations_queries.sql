-- =============================================
-- Requêtes SQL dédiées (MS SQL Server / SSMS) : Reservations
-- Format : -- name: nom_requete
-- Placeholders : ?
-- =============================================

-- name: get_all_reservations
SELECT r.id, r.user_id, r.room_id, r.title, r.description,
       r.reservation_date, r.start_time, r.end_time, r.status,
       r.admin_comment, r.approved_by, r.created_at, r.updated_at,
       u.full_name AS user_name, u.email AS user_email, u.department,
       rm.name AS room_name
FROM reservations r
JOIN users u  ON r.user_id = u.id
JOIN rooms rm ON r.room_id = rm.id
ORDER BY r.reservation_date DESC, r.start_time;

-- name: get_reservations_by_user
SELECT r.id, r.user_id, r.room_id, r.title, r.description,
       r.reservation_date, r.start_time, r.end_time, r.status,
       r.admin_comment, r.approved_by, r.created_at, r.updated_at,
       rm.name AS room_name
FROM reservations r
JOIN rooms rm ON r.room_id = rm.id
WHERE r.user_id = ?
ORDER BY r.reservation_date DESC, r.start_time;

-- name: get_reservation_by_id
SELECT r.id, r.user_id, r.room_id, r.title, r.description,
       r.reservation_date, r.start_time, r.end_time, r.status,
       r.admin_comment, r.approved_by, r.created_at, r.updated_at,
       u.full_name AS user_name, u.email AS user_email, u.department,
       rm.name AS room_name
FROM reservations r
JOIN users u  ON r.user_id = u.id
JOIN rooms rm ON r.room_id = rm.id
WHERE r.id = ?;

-- name: create_reservation
INSERT INTO reservations (user_id, room_id, title, description,
                          reservation_date, start_time, end_time)
OUTPUT INSERTED.id
VALUES (?, ?, ?, ?, ?, ?, ?);

-- name: update_reservation
UPDATE reservations
SET room_id = ?, title = ?, description = ?,
    reservation_date = ?, start_time = ?, end_time = ?,
    updated_at = GETDATE()
WHERE id = ? AND user_id = ? AND status = 'pending';

-- name: delete_reservation
DELETE FROM reservations
WHERE id = ? AND user_id = ? AND status = 'pending';

-- name: admin_delete_reservation
DELETE FROM reservations WHERE id = ?;

-- name: approve_reservation
UPDATE reservations
SET status = 'approved', admin_comment = ?,
    approved_by = ?, updated_at = GETDATE()
WHERE id = ? AND status = 'pending';

-- name: reject_reservation
UPDATE reservations
SET status = 'rejected', admin_comment = ?,
    approved_by = ?, updated_at = GETDATE()
WHERE id = ? AND status = 'pending';

-- name: get_processed_reservations
SELECT r.id, r.user_id, r.room_id, r.title, r.description,
       r.reservation_date, r.start_time, r.end_time, r.status,
       r.admin_comment, r.approved_by, r.created_at, r.updated_at,
       u.full_name AS user_name, u.email AS user_email, u.department,
       rm.name AS room_name,
       admin.full_name AS approved_by_name
FROM reservations r
JOIN users u  ON r.user_id = u.id
JOIN rooms rm ON r.room_id = rm.id
LEFT JOIN users admin ON r.approved_by = admin.id
WHERE r.status IN ('approved', 'rejected')
ORDER BY r.updated_at DESC;

-- name: admin_change_status
UPDATE reservations
SET status = ?, admin_comment = ?,
    approved_by = ?, updated_at = GETDATE()
WHERE id = ?;

-- name: get_pending_reservations
SELECT r.id, r.user_id, r.room_id, r.title, r.description,
       r.reservation_date, r.start_time, r.end_time, r.status,
       r.created_at,
       u.full_name AS user_name, u.email AS user_email, u.department,
       rm.name AS room_name
FROM reservations r
JOIN users u  ON r.user_id = u.id
JOIN rooms rm ON r.room_id = rm.id
WHERE r.status = 'pending'
ORDER BY r.created_at;

-- name: check_conflict
SELECT id, title, start_time, end_time
FROM reservations
WHERE room_id = ?
  AND reservation_date = ?
  AND status != 'rejected'
  AND id != ?
  AND (
      (start_time < ? AND end_time > ?)
      OR (start_time >= ? AND start_time < ?)
  );

-- name: get_reservations_by_date_range
SELECT r.id, r.user_id, r.room_id, r.title, r.description,
       r.reservation_date, r.start_time, r.end_time, r.status,
       r.admin_comment, r.created_at,
       u.full_name AS user_name, u.department,
       rm.name AS room_name
FROM reservations r
JOIN users u  ON r.user_id = u.id
JOIN rooms rm ON r.room_id = rm.id
WHERE r.reservation_date BETWEEN ? AND ?
ORDER BY r.reservation_date, r.start_time;

-- name: get_planning_for_user
SELECT r.id, r.user_id, r.room_id, r.title, r.description,
       r.reservation_date, r.start_time, r.end_time, r.status,
       r.admin_comment, r.created_at,
       u.full_name AS user_name, u.department,
       rm.name AS room_name
FROM reservations r
JOIN users u  ON r.user_id = u.id
JOIN rooms rm ON r.room_id = rm.id
WHERE r.reservation_date BETWEEN ? AND ?
  AND (
    r.status = 'approved'
    OR r.user_id = ?
  )
ORDER BY r.reservation_date, r.start_time;

-- name: get_stats
SELECT
    COUNT(*) AS total,
    SUM(CASE WHEN status = 'pending'  THEN 1 ELSE 0 END) AS pending_count,
    SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved_count,
    SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected_count
FROM reservations;

-- name: get_today_reservations
SELECT r.id, r.title, r.start_time, r.end_time, r.status,
       rm.name AS room_name, u.full_name AS user_name
FROM reservations r
JOIN users u  ON r.user_id = u.id
JOIN rooms rm ON r.room_id = rm.id
WHERE r.reservation_date = CAST(GETDATE() AS DATE)
  AND r.status = 'approved'
ORDER BY r.start_time;
