-- =============================================
-- Requêtes SQL dédiées (MS SQL Server / SSMS) : Rooms
-- Format : -- name: nom_requete
-- Placeholders : ?
-- =============================================

-- name: get_all_rooms
SELECT id, name, capacity, floor, description, is_active, created_at
FROM rooms
WHERE is_active = 1
ORDER BY name;

-- name: get_all_rooms_with_inactive
SELECT id, name, capacity, floor, description, is_active, created_at
FROM rooms
ORDER BY name;

-- name: get_room_by_id
SELECT id, name, capacity, floor, description, is_active, created_at
FROM rooms
WHERE id = ?;

-- name: create_room
INSERT INTO rooms (name, capacity, floor, description)
OUTPUT INSERTED.id
VALUES (?, ?, ?, ?);

-- name: update_room
UPDATE rooms SET name = ?, capacity = ?, floor = ?, description = ?
WHERE id = ?;

-- name: soft_delete_room
UPDATE rooms SET is_active = 0 WHERE id = ?;

-- name: get_room_equipment
SELECT id, equipment_name FROM room_equipment WHERE room_id = ?;

-- name: add_room_equipment
INSERT INTO room_equipment (room_id, equipment_name) VALUES (?, ?);

-- name: delete_room_equipment
DELETE FROM room_equipment WHERE room_id = ?;

-- name: check_room_name_exists
SELECT COUNT(*) as cnt FROM rooms WHERE name = ? AND id != ?;
