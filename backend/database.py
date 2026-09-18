"""
Module de base de données pour Microsoft SQL Server (SSMS).
- Connexions pyodbc (Windows Auth ou SQL Auth)
- Chargement de requêtes nommées depuis les fichiers SQL dédiés
"""
import os
from contextlib import contextmanager
import pyodbc
from config import settings


class Database:
    _queries_cache: dict[str, dict[str, str]] = {}

    @classmethod
    def get_connection_string(cls, use_db: bool = True) -> str:
        """Génère la chaîne de connexion pyodbc pour MS SQL Server."""
        settings.validate_database_credentials()
        drivers = [d for d in pyodbc.drivers() if "SQL Server" in d]
        driver = settings.DB_DRIVER if settings.DB_DRIVER in drivers else (drivers[0] if drivers else "SQL Server")

        conn_str = f"DRIVER={{{driver}}};SERVER={settings.DB_SERVER}"
        if use_db:
            conn_str += f";DATABASE={settings.DB_NAME}"

        if settings.DB_TRUSTED_CONNECTION:
            conn_str += ";Trusted_Connection=yes;"
        else:
            conn_str += f";UID={settings.DB_USER};PWD={settings.DB_PASSWORD};"

        conn_str += f";Encrypt={'yes' if settings.DB_ENCRYPT else 'no'};"
        conn_str += (
            "TrustServerCertificate="
            f"{'yes' if settings.DB_TRUST_SERVER_CERTIFICATE else 'no'};"
        )
        return conn_str

    @classmethod
    @contextmanager
    def get_connection(cls, use_db: bool = True):
        """Context manager pour la connexion SQL Server via pyodbc."""
        conn_str = cls.get_connection_string(use_db=use_db)
        conn = pyodbc.connect(conn_str, autocommit=False)
        try:
            yield conn
        finally:
            conn.close()

    # ── Chargement des requêtes SQL ──

    @classmethod
    def get_query(cls, file_path: str, query_name: str) -> str:
        """
        Retourne une requête nommée depuis un fichier SQL.
        Format attendu dans le fichier :
            -- name: ma_requete
            SELECT * FROM table WHERE id = ?;
        """
        if file_path not in cls._queries_cache:
            cls._load_queries(file_path)
        if query_name not in cls._queries_cache[file_path]:
            raise KeyError(f"Requête '{query_name}' introuvable dans '{file_path}'")
        return cls._queries_cache[file_path][query_name]

    @classmethod
    def _load_queries(cls, file_path: str):
        """Parse un fichier SQL et extrait les requêtes nommées."""
        queries = {}
        current_name = None
        current_lines = []

        full_path = os.path.join(os.path.dirname(__file__), file_path)
        with open(full_path, "r", encoding="utf-8") as f:
            for line in f:
                stripped = line.strip()
                if stripped.startswith("-- name:"):
                    if current_name and current_lines:
                        queries[current_name] = "".join(current_lines).strip()
                    current_name = stripped.split("-- name:")[1].strip()
                    current_lines = []
                elif current_name is not None:
                    current_lines.append(line)

        if current_name and current_lines:
            queries[current_name] = "".join(current_lines).strip()

        cls._queries_cache[file_path] = queries

    # ── Exécution de requêtes ──

    @classmethod
    def execute(cls, query: str, params: tuple = None,
                fetch_one: bool = False, fetch_all: bool = False):
        """Exécute une requête SQL et retourne les résultats sous forme de dictionnaires."""
        with cls.get_connection() as conn:
            cursor = conn.cursor()
            try:
                if params:
                    cursor.execute(query, params)
                else:
                    cursor.execute(query)

                if fetch_one:
                    row = cursor.fetchone()
                    if row is None:
                        return None
                    columns = [column[0] for column in cursor.description]
                    return dict(zip(columns, row))
                elif fetch_all:
                    rows = cursor.fetchall()
                    if not rows:
                        return []
                    columns = [column[0] for column in cursor.description]
                    return [dict(zip(columns, row)) for row in rows]
                else:
                    conn.commit()
                    # Si la requete retourne directement des colonnes (ex: OUTPUT INSERTED.id)
                    if cursor.description:
                        row = cursor.fetchone()
                        return row[0] if row else None
                    # Si c'est un batch (ex: INSERT suivi de SELECT SCOPE_IDENTITY())
                    while cursor.nextset():
                        if cursor.description:
                            row = cursor.fetchone()
                            return row[0] if row else None
                    return cursor.rowcount
            finally:
                cursor.close()

    @classmethod
    def execute_many(cls, query: str, params_list: list[tuple]):
        """Exécute une requête SQL pour plusieurs jeux de paramètres."""
        with cls.get_connection() as conn:
            cursor = conn.cursor()
            try:
                cursor.executemany(query, params_list)
                conn.commit()
            finally:
                cursor.close()
