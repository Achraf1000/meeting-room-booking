"""Routes pour les réservations et l'approbation."""
from fastapi import APIRouter, Depends, HTTPException, Query
from datetime import date
from reservations.schemas import ReservationCreate, ReservationUpdate, ApprovalRequest, StatusChangeRequest
from reservations import service
from auth.dependencies import get_current_user, require_admin

router = APIRouter(prefix="/api/reservations", tags=["Réservations"])


@router.get("")
async def list_reservations(
    start_date: date | None = Query(None),
    end_date: date | None = Query(None),
    user: dict = Depends(get_current_user),
):
    """Liste les réservations, avec filtre optionnel par dates.
    - Admin : voit toutes les réservations
    - Utilisateur : voit les réservations approuvées + ses propres demandes
    """
    is_admin = user.get("role") == "admin"

    if start_date and end_date:
        if is_admin:
            return service.get_reservations_by_date_range(start_date, end_date)
        return service.get_planning_for_user(start_date, end_date, user["id"])

    if is_admin:
        return service.get_all_reservations()
    return service.get_reservations_by_user(user["id"])


@router.get("/my")
async def my_reservations(user: dict = Depends(get_current_user)):
    """Mes réservations."""
    return service.get_reservations_by_user(user["id"])


@router.get("/pending")
async def pending_reservations(admin: dict = Depends(require_admin)):
    """Réservations en attente d'approbation (admin)."""
    return service.get_pending_reservations()


@router.get("/history")
async def approval_history(admin: dict = Depends(require_admin)):
    """Historique des réservations traitées (approuvées/rejetées) par l'admin."""
    return service.get_processed_reservations()


@router.get("/stats")
async def reservation_stats(admin: dict = Depends(require_admin)):
    """Statistiques des réservations (admin)."""
    return service.get_stats()


@router.get("/today")
async def today_reservations(user: dict = Depends(get_current_user)):
    """Réservations approuvées d'aujourd'hui."""
    return service.get_today_reservations()


@router.get("/{reservation_id}")
async def get_reservation(reservation_id: int, user: dict = Depends(get_current_user)):
    """Détails d'une réservation."""
    reservation = service.get_reservation_by_id(reservation_id)
    if not reservation:
        raise HTTPException(status_code=404, detail="Réservation introuvable")
    return reservation


@router.post("", status_code=201)
async def create_reservation(req: ReservationCreate, user: dict = Depends(get_current_user)):
    """Créer une demande de réservation."""
    try:
        res_id = service.create_reservation(
            user_id=user["id"],
            room_id=req.room_id,
            title=req.title,
            description=req.description,
            reservation_date=req.reservation_date,
            start_time=req.start_time,
            end_time=req.end_time,
        )
        return {"id": res_id, "message": "Demande de réservation créée avec succès"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{reservation_id}")
async def update_reservation(
    reservation_id: int, req: ReservationUpdate, user: dict = Depends(get_current_user)
):
    """Modifier sa réservation (seulement si pending)."""
    try:
        service.update_reservation(
            reservation_id=reservation_id,
            user_id=user["id"],
            room_id=req.room_id,
            title=req.title,
            description=req.description,
            reservation_date=req.reservation_date,
            start_time=req.start_time,
            end_time=req.end_time,
        )
        return {"message": "Réservation modifiée avec succès"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{reservation_id}")
async def delete_reservation(reservation_id: int, user: dict = Depends(get_current_user)):
    """Annuler sa réservation (seulement si pending)."""
    service.delete_reservation(reservation_id, user["id"])
    return {"message": "Réservation annulée"}


@router.put("/{reservation_id}/approve")
async def approve(
    reservation_id: int, req: ApprovalRequest, admin: dict = Depends(require_admin)
):
    """Approuver une réservation (admin)."""
    existing = service.get_reservation_by_id(reservation_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Réservation introuvable")
    if existing["status"] != "pending":
        raise HTTPException(status_code=400, detail="Cette réservation n'est plus en attente")
    service.approve_reservation(reservation_id, admin["id"], req.comment)
    return {"message": "Réservation approuvée"}


@router.put("/{reservation_id}/reject")
async def reject(
    reservation_id: int, req: ApprovalRequest, admin: dict = Depends(require_admin)
):
    """Rejeter une réservation (admin)."""
    existing = service.get_reservation_by_id(reservation_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Réservation introuvable")
    if existing["status"] != "pending":
        raise HTTPException(status_code=400, detail="Cette réservation n'est plus en attente")
    service.reject_reservation(reservation_id, admin["id"], req.comment)
    return {"message": "Réservation rejetée"}


@router.put("/{reservation_id}/change-status")
async def change_status(
    reservation_id: int, req: StatusChangeRequest, admin: dict = Depends(require_admin)
):
    """Corriger le statut d'une réservation déjà traitée (admin)."""
    existing = service.get_reservation_by_id(reservation_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Réservation introuvable")
    try:
        service.admin_change_status(reservation_id, req.status, admin["id"], req.comment)
        status_label = {"approved": "approuvée", "rejected": "rejetée", "pending": "remise en attente"}
        return {"message": f"Réservation {status_label.get(req.status, 'modifiée')}"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
