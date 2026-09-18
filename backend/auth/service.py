"""
Service d'authentification.
- Hashage des mots de passe (Argon2)
- Création / vérification des tokens JWT
"""
from datetime import datetime, timedelta, timezone
import jwt
from passlib.hash import argon2
from config import settings


# ── Hashage mot de passe ──

def hash_password(password: str) -> str:
    """Hash un mot de passe avec Argon2."""
    return argon2.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Vérifie un mot de passe contre son hash Argon2."""
    return argon2.verify(plain_password, hashed_password)


# ── Tokens JWT ──

def create_access_token(data: dict) -> str:
    """Crée un access token JWT (courte durée)."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    to_encode.update({"exp": expire, "iss": settings.JWT_ISSUER, "type": "access"})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(data: dict) -> str:
    """Crée un refresh token JWT (longue durée)."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )
    to_encode.update({"exp": expire, "iss": settings.JWT_ISSUER, "type": "refresh"})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> dict | None:
    """Décode et valide un token JWT. Retourne None si invalide."""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
            issuer=settings.JWT_ISSUER,
        )
        return payload
    except jwt.PyJWTError:
        return None
