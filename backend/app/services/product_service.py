from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .. import models, schemas


def list_products(db: Session) -> list[models.Product]:
    return db.query(models.Product).order_by(models.Product.id).all()


def get_product(db: Session, product_id: int) -> models.Product:
    product = db.get(models.Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


def create_product(db: Session, payload: schemas.ProductCreate) -> models.Product:
    # Business rule: SKU must be unique.
    existing = db.query(models.Product).filter(models.Product.sku == payload.sku).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"SKU '{payload.sku}' already exists")

    product = models.Product(**payload.model_dump())
    db.add(product)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail=f"SKU '{payload.sku}' already exists")
    db.refresh(product)
    return product


def update_product(
    db: Session, product_id: int, payload: schemas.ProductUpdate
) -> models.Product:
    product = db.get(models.Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return product


def delete_product(db: Session, product_id: int) -> None:
    product = db.get(models.Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.order_items:
        raise HTTPException(
            status_code=409,
            detail="Cannot delete a product that is referenced by existing orders",
        )
    db.delete(product)
    db.commit()
