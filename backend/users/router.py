"""Routes pour la gestion des utilisateurs."""
from fastapi import APIRouter, Depends, HTTPException
from users import service, schemas
from auth.dependencies import get_current_user, require_admin

router = APIRouter(prefix="/api/users", tags=["Utilisateurs"])


@router.get("/me")
async def get_my_profile(user: dict = Depends(get_current_user)):
    """Profil de l'utilisateur connecté."""
    return {
        "id": user["id"],
        "full_name": user["full_name"],
        "email": user["email"],
        "role": user["role"],
        "department": user["department"],
    }


@router.put("/me")
async def update_my_profile(
    req: schemas.ProfileUpdateRequest,
    user: dict = Depends(get_current_user),
):
    """Mise à jour des informations de profil de l'utilisateur connecté."""
    if not req.full_name.strip():
        raise HTTPException(status_code=400, detail="Le nom complet est obligatoire")
    service.update_user_profile(user["id"], req.full_name.strip(), req.department)
    return {
        "id": user["id"],
        "full_name": req.full_name.strip(),
        "email": user["email"],
        "role": user["role"],
        "department": req.department,
    }


@router.put("/me/password")
async def change_password(
    req: schemas.PasswordChangeRequest,
    user: dict = Depends(get_current_user),
):
    """Changement du mot de passe de l'utilisateur connecté."""
    from auth.service import verify_password, hash_password

    if len(req.new_password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Le nouveau mot de passe doit contenir au moins 8 caractères",
        )

    db_user = service.get_user_with_password(user["id"])
    if not db_user or not verify_password(req.current_password, db_user["password_hash"]):
        raise HTTPException(
            status_code=400, detail="Le mot de passe actuel est incorrect"
        )

    new_hash = hash_password(req.new_password)
    service.update_user_password(user["id"], new_hash)
    return {"message": "Mot de passe modifié avec succès"}


@router.get("")
async def list_users(admin: dict = Depends(require_admin)):
    """Liste tous les utilisateurs (admin)."""
    return service.get_all_users()


@router.put("/{user_id}/status")
async def toggle_user_status(
    user_id: int, is_active: bool, admin: dict = Depends(require_admin)
):
    """Activer/désactiver un utilisateur (admin)."""
    target = service.get_user_by_id(user_id)
    if not target:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    if target["id"] == admin["id"]:
        raise HTTPException(status_code=400, detail="Vous ne pouvez pas vous désactiver vous-même")
    service.update_user_status(user_id, is_active)
    return {"message": f"Utilisateur {'activé' if is_active else 'désactivé'}"}
