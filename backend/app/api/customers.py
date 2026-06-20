from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from .. import schemas
from ..core.database import get_db
from ..services import customer_service

router = APIRouter(prefix="/api/customers", tags=["customers"])


@router.get("", response_model=list[schemas.CustomerOut])
def list_customers(db: Session = Depends(get_db)):
    return customer_service.list_customers(db)


@router.get("/{customer_id}", response_model=schemas.CustomerOut)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    return customer_service.get_customer(db, customer_id)


@router.post("", response_model=schemas.CustomerOut, status_code=status.HTTP_201_CREATED)
def create_customer(payload: schemas.CustomerCreate, db: Session = Depends(get_db)):
    return customer_service.create_customer(db, payload)


@router.put("/{customer_id}", response_model=schemas.CustomerOut)
def update_customer(
    customer_id: int, payload: schemas.CustomerUpdate, db: Session = Depends(get_db)
):
    return customer_service.update_customer(db, customer_id, payload)


@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    customer_service.delete_customer(db, customer_id)
