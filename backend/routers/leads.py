"""Роуты заявок (leads)."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

import crud
from database import get_db
from schemas import LeadCreate, LeadResponse

router = APIRouter(prefix="/leads", tags=["leads"])


@router.post(
    "",
    response_model=LeadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Создать заявку",
)
def create_lead(
    payload: LeadCreate,
    db: Session = Depends(get_db),
) -> LeadResponse:
    try:
        lead = crud.create_lead(db, payload)
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Не удалось сохранить заявку",
        ) from None
    return LeadResponse.model_validate(lead)


@router.get(
    "",
    response_model=list[LeadResponse],
    summary="Список заявок",
)
def list_leads(db: Session = Depends(get_db)) -> list[LeadResponse]:
    try:
        leads = crud.get_leads(db)
    except SQLAlchemyError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Не удалось получить список заявок",
        ) from None
    return [LeadResponse.model_validate(x) for x in leads]
