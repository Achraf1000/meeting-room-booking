"""Schémas Pydantic pour les utilisateurs."""
from pydantic import BaseModel, Field


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    role: str
    department: str | None
    is_active: bool


class ProfileUpdateRequest(BaseModel):
    full_name: str
    department: str | None = None


class PasswordChangeRequest(BaseModel):
    current_password: str = Field(min_length=8, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)
