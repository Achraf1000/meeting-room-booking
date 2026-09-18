"""Configuration centralisée et chargée depuis les variables d'environnement."""

import os
from pathlib import Path

from dotenv import load_dotenv


load_dotenv(Path(__file__).resolve().parent / ".env")


def _as_bool(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _as_list(name: str, default: str) -> list[str]:
    value = os.getenv(name, default)
    return [item.strip().rstrip("/") for item in value.split(",") if item.strip()]


class Settings:
    # SQL Server
    DB_SERVER: str = os.getenv("DB_SERVER", "localhost")
    DB_NAME: str = os.getenv("DB_NAME", "meeting_room_booking")
    DB_USER: str = os.getenv("DB_USER", "")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "")
    DB_TRUSTED_CONNECTION: bool = _as_bool("DB_TRUSTED_CONNECTION", True)
    DB_DRIVER: str = os.getenv("DB_DRIVER", "ODBC Driver 18 for SQL Server")
    DB_ENCRYPT: bool = _as_bool("DB_ENCRYPT", True)
    DB_TRUST_SERVER_CERTIFICATE: bool = _as_bool(
        "DB_TRUST_SERVER_CERTIFICATE", False
    )

    # JWT et cookies
    JWT_SECRET: str = os.getenv("JWT_SECRET", "")
    JWT_ALGORITHM: str = "HS256"
    JWT_ISSUER: str = os.getenv("JWT_ISSUER", "meeting-room-booking")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30")
    )
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(
        os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7")
    )
    COOKIE_SECURE: bool = _as_bool("COOKIE_SECURE", False)

    # Règles métier
    WORK_START_HOUR: int = int(os.getenv("WORK_START_HOUR", "8"))
    WORK_END_HOUR: int = int(os.getenv("WORK_END_HOUR", "19"))

    # Compte administrateur créé par init_db.py
    DEFAULT_ADMIN_EMAIL: str = os.getenv("DEFAULT_ADMIN_EMAIL", "admin@example.test")
    DEFAULT_ADMIN_PASSWORD: str = os.getenv("DEFAULT_ADMIN_PASSWORD", "")
    DEFAULT_ADMIN_NAME: str = os.getenv("DEFAULT_ADMIN_NAME", "Administrateur")

    # Origines autorisées, séparées par des virgules
    CORS_ORIGINS: list[str] = _as_list(
        "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
    )

    @classmethod
    def validate_runtime_secrets(cls) -> None:
        if len(cls.JWT_SECRET) < 32 or cls.JWT_SECRET.startswith("replace-"):
            raise RuntimeError(
                "JWT_SECRET doit être défini avec une valeur aléatoire d'au moins 32 caractères."
            )

    @classmethod
    def validate_database_credentials(cls) -> None:
        if not cls.DB_TRUSTED_CONNECTION and (
            not cls.DB_USER or not cls.DB_PASSWORD
        ):
            raise RuntimeError(
                "DB_USER et DB_PASSWORD sont requis lorsque DB_TRUSTED_CONNECTION=false."
            )


settings = Settings()
