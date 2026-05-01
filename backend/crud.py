"""Операции с заявками в БД."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from models import Lead
from schemas import LeadCreate


def create_lead(db: Session, data: LeadCreate) -> Lead:
    lead = Lead(name=data.name, phone=data.phone)
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead


def get_leads(db: Session) -> list[Lead]:
    result = db.scalars(select(Lead).order_by(Lead.created_at.desc()))
    return list(result.all())
