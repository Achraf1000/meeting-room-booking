"""Service métier pour les salles de réunion."""
from database import Database

QUERIES_FILE = "sql/queries/rooms_queries.sql"


def get_all_rooms(include_inactive: bool = False):
    """Retourne toutes les salles actives (ou toutes si include_inactive)."""
    query_name = "get_all_rooms_with_inactive" if include_inactive else "get_all_rooms"
    query = Database.get_query(QUERIES_FILE, query_name)
    rooms = Database.execute(query, fetch_all=True) or []

    # Ajouter les équipements à chaque salle
    eq_query = Database.get_query(QUERIES_FILE, "get_room_equipment")
    for room in rooms:
        equipment = Database.execute(eq_query, (room["id"],), fetch_all=True) or []
        room["equipment"] = [e["equipment_name"] for e in equipment]

    return rooms


def get_room_by_id(room_id: int):
    """Retourne une salle par son ID avec ses équipements."""
    query = Database.get_query(QUERIES_FILE, "get_room_by_id")
    room = Database.execute(query, (room_id,), fetch_one=True)
    if room:
        eq_query = Database.get_query(QUERIES_FILE, "get_room_equipment")
        equipment = Database.execute(eq_query, (room_id,), fetch_all=True) or []
        room["equipment"] = [e["equipment_name"] for e in equipment]
    return room


def create_room(name: str, capacity: int, floor: str, description: str, equipment: list[str]):
    """Crée une nouvelle salle avec ses équipements."""
    query = Database.get_query(QUERIES_FILE, "create_room")
    room_id = Database.execute(query, (name, capacity, floor, description))

    if equipment:
        eq_query = Database.get_query(QUERIES_FILE, "add_room_equipment")
        for eq in equipment:
            Database.execute(eq_query, (room_id, eq))

    return room_id


def update_room(room_id: int, name: str, capacity: int, floor: str,
                description: str, equipment: list[str]):
    """Met à jour une salle et ses équipements."""
    query = Database.get_query(QUERIES_FILE, "update_room")
    Database.execute(query, (name, capacity, floor, description, room_id))

    # Recréer les équipements
    del_query = Database.get_query(QUERIES_FILE, "delete_room_equipment")
    Database.execute(del_query, (room_id,))

    if equipment:
        eq_query = Database.get_query(QUERIES_FILE, "add_room_equipment")
        for eq in equipment:
            Database.execute(eq_query, (room_id, eq))


def delete_room(room_id: int):
    """Soft-delete une salle."""
    query = Database.get_query(QUERIES_FILE, "soft_delete_room")
    Database.execute(query, (room_id,))
