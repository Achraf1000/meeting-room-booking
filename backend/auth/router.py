"""
Routes d'authentification : login, register, refresh, logout.
"""
from fastapi import APIRouter, HTTPException, status, Response, Request
from auth.schemas import LoginRequest, RegisterRequest, TokenResponse, RefreshResponse
from auth.service import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_token,
)
from database import Database
from config import settings

router = APIRouter(prefix="/api/auth", tags=["Authentification"])

QUERIES_FILE = "sql/queries/users_queries.sql"


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(req: RegisterRequest, response: Response):
    """Inscription d'un nouvel utilisateur."""
    # Vérifier si l'email existe déjà
    query = Database.get_query(QUERIES_FILE, "check_email_exists")
    result = Database.execute(query, (req.email,), fetch_one=True)
    if result and result["cnt"] > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cet email est déjà utilisé",
        )

    # Créer l'utilisateur
    hashed = hash_password(req.password)
    query = Database.get_query(QUERIES_FILE, "create_user")
    user_id = Database.execute(
        query, (req.full_name, req.email, hashed, "user", req.department)
    )

    # Récupérer l'utilisateur pour garantir l'ID exact et toutes les données
    user_query = Database.get_query(QUERIES_FILE, "get_user_by_email")
    created_user = Database.execute(user_query, (req.email,), fetch_one=True)
    if created_user:
        user_id = created_user["id"]

    # Générer les tokens
    token_data = {"sub": str(user_id), "role": "user", "email": req.email}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    # Refresh token en cookie HttpOnly
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        path="/api/auth",
    )

    return TokenResponse(
        access_token=access_token,
        user={
            "id": user_id,
            "full_name": req.full_name,
            "email": req.email,
            "role": "user",
            "department": req.department,
        },
    )


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, response: Response):
    """Connexion d'un utilisateur existant."""
    query = Database.get_query(QUERIES_FILE, "get_user_by_email")
    user = Database.execute(query, (req.email,), fetch_one=True)

    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
        )

    if not user["is_active"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Compte désactivé. Contactez l'administrateur.",
        )

    token_data = {"sub": str(user["id"]), "role": user["role"], "email": user["email"]}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        path="/api/auth",
    )

    return TokenResponse(
        access_token=access_token,
        user={
            "id": user["id"],
            "full_name": user["full_name"],
            "email": user["email"],
            "role": user["role"],
            "department": user["department"],
        },
    )


@router.post("/refresh", response_model=RefreshResponse)
async def refresh_token(request: Request, response: Response):
    """Rafraîchit l'access token via le refresh token cookie."""
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token manquant",
        )

    payload = decode_token(token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token invalide ou expiré",
        )

    # Nouveau access token
    token_data = {
        "sub": payload["sub"],
        "role": payload["role"],
        "email": payload["email"],
    }
    new_access = create_access_token(token_data)

    # Rotation du refresh token
    new_refresh = create_refresh_token(token_data)
    response.set_cookie(
        key="refresh_token",
        value=new_refresh,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        path="/api/auth",
    )

    return RefreshResponse(access_token=new_access)


@router.post("/logout")
async def logout(response: Response):
    """Déconnexion : supprime le cookie refresh token."""
    response.delete_cookie(key="refresh_token", path="/api/auth")
    return {"message": "Déconnexion réussie"}
