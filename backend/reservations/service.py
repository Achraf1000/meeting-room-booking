"""Service métier pour les réservations."""
from datetime import date, time
from database import Database
from config import settings

QUERIES_FILE = "sql/queries/reservations_queries.sql"


def _validate_hours(start_time: time, end_time: time):
    """Vérifie que les horaires sont dans la plage 8h-19h."""
    if start_time >= end_time:
        raise ValueError("L'heure de début doit être avant l'heure de fin")
    if start_time.hour < settings.WORK_START_HOUR:
        raise ValueError(f"L'heure de début doit être après {settings.WORK_START_HOUR}h")
    if end_time.hour > settings.WORK_END_HOUR or (
        end_time.hour == settings.WORK_END_HOUR and end_time.minute > 0
    ):
        raise ValueError(f"L'heure de fin doit être avant {settings.WORK_END_HOUR}h")


def check_conflict(room_id: int, reservation_date: date,
                    start_time: time, end_time: time,
                    exclude_id: int = 0) -> list:
    """Vérifie s'il y a un conflit horaire pour cette salle."""
    query = Database.get_query(QUERIES_FILE, "check_conflict")
    conflicts = Database.execute(
        query,
        (room_id, reservation_date, exclude_id,
         str(end_time), str(start_time),
         str(start_time), str(end_time)),
        fetch_all=True,
    )
    return conflicts or []


def get_all_reservations():
    """Retourne toutes les réservations."""
    query = Database.get_query(QUERIES_FILE, "get_all_reservations")
    return Database.execute(query, fetch_all=True) or []


def get_reservations_by_user(user_id: int):
    """Retourne les réservations d'un utilisateur."""
    query = Database.get_query(QUERIES_FILE, "get_reservations_by_user")
    return Database.execute(query, (user_id,), fetch_all=True) or []


def get_reservation_by_id(reservation_id: int):
    """Retourne une réservation par ID."""
    query = Database.get_query(QUERIES_FILE, "get_reservation_by_id")
    return Database.execute(query, (reservation_id,), fetch_one=True)


def create_reservation(user_id: int, room_id: int, title: str,
                       description: str, reservation_date: date,
                       start_time: time, end_time: time) -> int:
    """Crée une nouvelle demande de réservation."""
    _validate_hours(start_time, end_time)

    conflicts = check_conflict(room_id, reservation_date, start_time, end_time)
    if conflicts:
        raise ValueError("Conflit horaire : cette salle est déjà réservée sur ce créneau")

    query = Database.get_query(QUERIES_FILE, "create_reservation")
    return Database.execute(
        query,
        (user_id, room_id, title, description,
         reservation_date, str(start_time), str(end_time)),
    )


def update_reservation(reservation_id: int, user_id: int, room_id: int,
                       title: str, description: str,
                       reservation_date: date, start_time: time, end_time: time):
    """Met à jour une réservation (seulement si pending et par le propriétaire)."""
    _validate_hours(start_time, end_time)

    conflicts = check_conflict(room_id, reservation_date, start_time, end_time,
                               exclude_id=reservation_id)
    if conflicts:
        raise ValueError("Conflit horaire : cette salle est déjà réservée sur ce créneau")

    query = Database.get_query(QUERIES_FILE, "update_reservation")
    Database.execute(
        query,
        (room_id, title, description, reservation_date,
         str(start_time), str(end_time), reservation_id, user_id),
    )


def delete_reservation(reservation_id: int, user_id: int):
    """Supprime une réservation pending du propriétaire."""
    query = Database.get_query(QUERIES_FILE, "delete_reservation")
    Database.execute(query, (reservation_id, user_id))


def approve_reservation(reservation_id: int, admin_id: int, comment: str = None):
    """Approuve une réservation (admin)."""
    query = Database.get_query(QUERIES_FILE, "approve_reservation")
    Database.execute(query, (comment, admin_id, reservation_id))


def reject_reservation(reservation_id: int, admin_id: int, comment: str = None):
    """Rejette une réservation (admin)."""
    query = Database.get_query(QUERIES_FILE, "reject_reservation")
    Database.execute(query, (comment, admin_id, reservation_id))


def get_processed_reservations():
    """Retourne les réservations déjà traitées (approuvées/rejetées)."""
    query = Database.get_query(QUERIES_FILE, "get_processed_reservations")
    return Database.execute(query, fetch_all=True) or []


def admin_change_status(reservation_id: int, new_status: str, admin_id: int, comment: str = None):
    """Permet à l'admin de corriger le statut d'une réservation déjà traitée."""
    if new_status not in ("approved", "rejected", "pending"):
        raise ValueError("Statut invalide")
    query = Database.get_query(QUERIES_FILE, "admin_change_status")
    Database.execute(query, (new_status, comment, admin_id, reservation_id))


def get_pending_reservations():
    """Retourne les réservations en attente."""
    query = Database.get_query(QUERIES_FILE, "get_pending_reservations")
    return Database.execute(query, fetch_all=True) or []


def get_reservations_by_date_range(start_date: date, end_date: date):
    """Retourne les réservations dans une plage de dates."""
    query = Database.get_query(QUERIES_FILE, "get_reservations_by_date_range")
    return Database.execute(query, (start_date, end_date), fetch_all=True) or []


def get_planning_for_user(start_date: date, end_date: date, user_id: int):
    """Retourne les réservations approuvées + celles de l'utilisateur courant."""
    query = Database.get_query(QUERIES_FILE, "get_planning_for_user")
    return Database.execute(query, (start_date, end_date, user_id), fetch_all=True) or []


def get_stats():
    """Retourne les statistiques globales des réservations."""
    query = Database.get_query(QUERIES_FILE, "get_stats")
    return Database.execute(query, fetch_one=True)


def get_today_reservations():
    """Retourne les réservations approuvées d'aujourd'hui."""
    query = Database.get_query(QUERIES_FILE, "get_today_reservations")
    return Database.execute(query, fetch_all=True) or []
