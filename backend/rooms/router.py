"""Routes CRUD pour les salles de réunion."""
from fastapi import APIRouter, Depends, HTTPException, status
from rooms.schemas import RoomCreate, RoomUpdate
from rooms import service
from auth.dependencies import get_current_user, require_admin

router = APIRouter(prefix="/api/rooms", tags=["Salles"])


@router.get("")
async def list_rooms(user: dict = Depends(get_current_user)):
    """Liste toutes les salles actives."""
    include_inactive = user.get("role") == "admin"
    return service.get_all_rooms(include_inactive=include_inactive)


@router.get("/{room_id}")
async def get_room(room_id: int, user: dict = Depends(get_current_user)):
    """Détails d'une salle."""
    room = service.get_room_by_id(room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Salle introuvable")
    return room


@router.post("", status_code=201)
async def create_room(req: RoomCreate, admin: dict = Depends(require_admin)):
    """Créer une nouvelle salle (admin)."""
    room_id = service.create_room(
        req.name, req.capacity, req.floor, req.description, req.equipment
    )
    return {"id": room_id, "message": "Salle créée avec succès"}


@router.put("/{room_id}")
async def update_room(room_id: int, req: RoomUpdate, admin: dict = Depends(require_admin)):
    """Modifier une salle (admin)."""
    existing = service.get_room_by_id(room_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Salle introuvable")
    service.update_room(room_id, req.name, req.capacity, req.floor, req.description, req.equipment)
    return {"message": "Salle modifiée avec succès"}


@router.delete("/{room_id}")
async def delete_room(room_id: int, admin: dict = Depends(require_admin)):
    """Supprimer une salle (admin, soft-delete)."""
    existing = service.get_room_by_id(room_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Salle introuvable")
    service.delete_room(room_id)
    return {"message": "Salle supprimée avec succès"}
