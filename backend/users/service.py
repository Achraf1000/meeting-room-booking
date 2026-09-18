"""Service métier pour les utilisateurs."""
from database import Database

QUERIES_FILE = "sql/queries/users_queries.sql"


def get_all_users():
    """Retourne tous les utilisateurs."""
    query = Database.get_query(QUERIES_FILE, "get_all_users")
    return Database.execute(query, fetch_all=True) or []


def get_user_by_id(user_id: int):
    """Retourne un utilisateur par son ID."""
    query = Database.get_query(QUERIES_FILE, "get_user_by_id")
    return Database.execute(query, (user_id,), fetch_one=True)


def update_user_status(user_id: int, is_active: bool):
    """Active ou désactive un utilisateur."""
    query = Database.get_query(QUERIES_FILE, "update_user_status")
    Database.execute(query, (int(is_active), user_id))


def update_user_profile(user_id: int, full_name: str, department: str | None):
    """Met à jour les informations du profil utilisateur."""
    query = Database.get_query(QUERIES_FILE, "update_user_profile")
    Database.execute(query, (full_name, department, user_id))


def update_user_password(user_id: int, password_hash: str):
    """Met à jour le mot de passe hashé de l'utilisateur."""
    query = Database.get_query(QUERIES_FILE, "update_user_password")
    Database.execute(query, (password_hash, user_id))


def get_user_with_password(user_id: int):
    """Retourne l'utilisateur avec son hash de mot de passe."""
    query = Database.get_query(QUERIES_FILE, "get_user_with_password_by_id")
    return Database.execute(query, (user_id,), fetch_one=True)
