"""
Dépendances FastAPI pour la sécurité.
- get_current_user : extrait l'utilisateur du token JWT
- require_admin : vérifie que l'utilisateur est admin
"""
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from auth.service import decode_token
from database import Database

security = HTTPBearer()

QUERIES_FILE = "sql/queries/users_queries.sql"


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """Extrait et valide l'utilisateur depuis le token Bearer."""
    token = credentials.credentials
    payload = decode_token(token)

    if payload is None or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide ou expiré",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide",
        )

    query = Database.get_query(QUERIES_FILE, "get_user_by_id")
    user = Database.execute(query, (int(user_id),), fetch_one=True)

    if user is None or not user.get("is_active"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Utilisateur introuvable ou désactivé",
        )

    return user


async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    """Vérifie que l'utilisateur connecté est un administrateur."""
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux administrateurs",
        )
    return user
