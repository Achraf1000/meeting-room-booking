"""Schémas Pydantic pour les réservations."""
from pydantic import BaseModel
from datetime import date, time


class ReservationCreate(BaseModel):
    room_id: int
    title: str
    description: str | None = None
    reservation_date: date
    start_time: time
    end_time: time


class ReservationUpdate(BaseModel):
    room_id: int
    title: str
    description: str | None = None
    reservation_date: date
    start_time: time
    end_time: time


class ApprovalRequest(BaseModel):
    comment: str | None = None


class StatusChangeRequest(BaseModel):
    status: str
    comment: str | None = None
