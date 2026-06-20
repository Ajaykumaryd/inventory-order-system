from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .. import models, schemas


def list_customers(db: Session) -> list[models.Customer]:
    return db.query(models.Customer).order_by(models.Customer.id).all()


def get_customer(db: Session, customer_id: int) -> models.Customer:
    customer = db.get(models.Customer, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


def create_customer(db: Session, payload: schemas.CustomerCreate) -> models.Customer:
    # Business rule: customer email must be unique.
    existing = (
        db.query(models.Customer).filter(models.Customer.email == payload.email).first()
    )
    if existing:
        raise HTTPException(
            status_code=409, detail=f"Email '{payload.email}' already exists"
        )

    customer = models.Customer(**payload.model_dump())
    db.add(customer)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409, detail=f"Email '{payload.email}' already exists"
        )
    db.refresh(customer)
    return customer


def update_customer(
    db: Session, customer_id: int, payload: schemas.CustomerUpdate
) -> models.Customer:
    customer = db.get(models.Customer, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(customer, field, value)
    db.commit()
    db.refresh(customer)
    return customer


def delete_customer(db: Session, customer_id: int) -> None:
    customer = db.get(models.Customer, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    if customer.orders:
        raise HTTPException(
            status_code=409,
            detail="Cannot delete a customer that has existing orders",
        )
    db.delete(customer)
    db.commit()
