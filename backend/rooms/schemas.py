"""Schémas Pydantic pour les salles."""
from pydantic import BaseModel


class RoomCreate(BaseModel):
    name: str
    capacity: int = 10
    floor: str | None = None
    description: str | None = None
    equipment: list[str] = []


class RoomUpdate(BaseModel):
    name: str
    capacity: int = 10
    floor: str | None = None
    description: str | None = None
    equipment: list[str] = []


class RoomResponse(BaseModel):
    id: int
    name: str
    capacity: int
    floor: str | None
    description: str | None
    is_active: bool
    equipment: list[str] = []
