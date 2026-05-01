"""Pydantic-схемы для API."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class LeadCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Имя клиента")
    phone: str = Field(..., min_length=5, max_length=64, description="Телефон")

    @field_validator("name", "phone")
    @classmethod
    def strip_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Поле не может быть пустым")
        return v


class LeadResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    phone: str
    created_at: datetime
