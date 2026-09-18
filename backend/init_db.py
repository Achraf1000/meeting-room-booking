"""Initialisation locale de SQL Server avec des données de démonstration."""
import os
import re

import pyodbc
from config import settings
from auth.service import hash_password


def get_master_connection():
    """Se connecte à la base 'master' sur SQL Server."""
    settings.validate_database_credentials()
    drivers = [d for d in pyodbc.drivers() if "SQL Server" in d]
    driver = settings.DB_DRIVER if settings.DB_DRIVER in drivers else (drivers[0] if drivers else "SQL Server")

    conn_str = f"DRIVER={{{driver}}};SERVER={settings.DB_SERVER};DATABASE=master"
    if settings.DB_TRUSTED_CONNECTION:
        conn_str += ";Trusted_Connection=yes;"
    else:
        conn_str += f";UID={settings.DB_USER};PWD={settings.DB_PASSWORD};"

    conn_str += f";Encrypt={'yes' if settings.DB_ENCRYPT else 'no'};"
    conn_str += (
        "TrustServerCertificate="
        f"{'yes' if settings.DB_TRUST_SERVER_CERTIFICATE else 'no'};"
    )
    return pyodbc.connect(conn_str, autocommit=True)


def get_db_connection():
    """Se connecte à la base applicative."""
    settings.validate_database_credentials()
    drivers = [d for d in pyodbc.drivers() if "SQL Server" in d]
    driver = settings.DB_DRIVER if settings.DB_DRIVER in drivers else (drivers[0] if drivers else "SQL Server")

    conn_str = f"DRIVER={{{driver}}};SERVER={settings.DB_SERVER};DATABASE={settings.DB_NAME}"
    if settings.DB_TRUSTED_CONNECTION:
        conn_str += ";Trusted_Connection=yes;"
    else:
        conn_str += f";UID={settings.DB_USER};PWD={settings.DB_PASSWORD};"

    conn_str += f";Encrypt={'yes' if settings.DB_ENCRYPT else 'no'};"
    conn_str += (
        "TrustServerCertificate="
        f"{'yes' if settings.DB_TRUST_SERVER_CERTIFICATE else 'no'};"
    )
    return pyodbc.connect(conn_str, autocommit=False)


def run_tsql_file(conn, filepath):
    """Exécute un fichier SQL T-SQL séparé par GO."""
    full_path = os.path.join(os.path.dirname(__file__), filepath)
    with open(full_path, "r", encoding="utf-8") as f:
        sql_content = f.read()

    cursor = conn.cursor()
    # Découper selon la commande 'GO' T-SQL
    statements = [stmt.strip() for stmt in sql_content.split("\nGO\n") if stmt.strip()]
    if len(statements) == 1:
        statements = [stmt.strip() for stmt in sql_content.split("\ngo\n") if stmt.strip()]
    if len(statements) == 1:
        statements = [stmt.strip() for stmt in sql_content.split("GO") if stmt.strip()]

    for statement in statements:
        if statement:
            cursor.execute(statement)
    cursor.close()


def init_database():
    """Initialise la base de données SQL Server."""
    settings.validate_runtime_secrets()
    settings.validate_database_credentials()
    if not re.fullmatch(r"[A-Za-z0-9_]+", settings.DB_NAME):
        raise RuntimeError("DB_NAME ne peut contenir que des lettres, chiffres et underscores.")
    if (
        len(settings.DEFAULT_ADMIN_PASSWORD) < 12
        or settings.DEFAULT_ADMIN_PASSWORD.startswith("replace-")
    ):
        raise RuntimeError(
            "DEFAULT_ADMIN_PASSWORD doit contenir au moins 12 caractères."
        )

    print("🔧 Connexion à Microsoft SQL Server...")
    try:
        # 1. Connexion à master et création de la BD
        conn_master = get_master_connection()
        cursor = conn_master.cursor()
        print(f"📦 Création de la base de données '{settings.DB_NAME}'...")
        cursor.execute(f"""
            IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = N'{settings.DB_NAME}')
            BEGIN
                CREATE DATABASE [{settings.DB_NAME}];
            END
        """)
        cursor.close()
        conn_master.close()

        # 2. Connexion à la base applicative et création des tables
        conn_db = get_db_connection()
        cursor = conn_db.cursor()

        print("📋 Création des tables T-SQL...")
        run_tsql_file(conn_db, "sql/002_create_users_table.sql")
        run_tsql_file(conn_db, "sql/003_create_rooms_table.sql")
        run_tsql_file(conn_db, "sql/004_create_room_equipment_table.sql")
        run_tsql_file(conn_db, "sql/005_create_reservations_table.sql")
        conn_db.commit()

        # 3. Compte Admin par défaut
        print("👤 Vérification du compte admin par défaut...")
        cursor.execute("SELECT COUNT(*) FROM users WHERE email = ?", (settings.DEFAULT_ADMIN_EMAIL,))
        count = cursor.fetchone()[0]
        if count == 0:
            hashed = hash_password(settings.DEFAULT_ADMIN_PASSWORD)
            cursor.execute(
                """INSERT INTO users (full_name, email, password_hash, role, department)
                   VALUES (?, ?, ?, 'admin', 'Administration')""",
                (settings.DEFAULT_ADMIN_NAME, settings.DEFAULT_ADMIN_EMAIL, hashed),
            )
            conn_db.commit()
            print(f"   ✅ Admin créé : {settings.DEFAULT_ADMIN_EMAIL}")
        else:
            print("   ℹ️  Admin existe déjà")

        # 4. Salles de réunion par défaut
        print("🏢 Vérification des salles de réunion...")
        cursor.execute("SELECT COUNT(*) FROM rooms")
        room_count = cursor.fetchone()[0]
        if room_count == 0:
            rooms = [
                ("Salle de Réunion A", 10, "1er étage",
                 "Grande salle avec vidéoprojecteur et tableau blanc"),
                ("Salle de Réunion B", 6, "2ème étage",
                 "Salle moyenne avec écran de visioconférence"),
            ]
            for name, capacity, floor, desc in rooms:
                cursor.execute(
                    "INSERT INTO rooms (name, capacity, floor, description) VALUES (?, ?, ?, ?)",
                    (name, capacity, floor, desc),
                )
                conn_db.commit()
                cursor.execute("SELECT @@IDENTITY")
                room_id = cursor.fetchone()[0]
                print(f"   ✅ Salle créée : {name}")

                # Équipements
                if "A" in name:
                    equips = ["Vidéoprojecteur", "Tableau blanc", "Climatisation", "WiFi"]
                else:
                    equips = ["Écran visioconférence", "Webcam HD", "Climatisation", "WiFi"]
                for eq in equips:
                    cursor.execute(
                        "INSERT INTO room_equipment (room_id, equipment_name) VALUES (?, ?)",
                        (room_id, eq),
                    )
            conn_db.commit()
        else:
            print(f"   ℹ️  {room_count} salle(s) existent déjà")

        cursor.close()
        conn_db.close()

        print("\n✅ Base de données SQL Server initialisée avec succès !")
        print(f"   📧 Admin : {settings.DEFAULT_ADMIN_EMAIL}")

    except Exception as e:
        print(f"\n❌ Erreur d'initialisation SQL Server : {e}")
        print("💡 Astuce : Vous pouvez aussi ouvrir le fichier 'backend/sql/ALL_TABLES_MS_SQL_SERVER.sql' dans SSMS et appuyer sur F5 (Exécuter).")
        raise


if __name__ == "__main__":
    init_database()
