from collections import defaultdict

from fastapi import HTTPException
from sqlalchemy.orm import Session, selectinload

from .. import models, schemas


def list_orders(db: Session) -> list[models.Order]:
    return (
        db.query(models.Order)
        .options(selectinload(models.Order.items))
        .order_by(models.Order.id.desc())
        .all()
    )


def get_order(db: Session, order_id: int) -> models.Order:
    order = (
        db.query(models.Order)
        .options(selectinload(models.Order.items))
        .filter(models.Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


def create_order(db: Session, payload: schemas.OrderCreate) -> models.Order:
    """Create an order, enforcing inventory rules atomically.

    Business rules enforced here:
      * The customer must exist.
      * Every referenced product must exist.
      * Stock must be sufficient for the requested quantity, otherwise the
        order is rejected (HTTP 422) and NOTHING is committed.
      * On success, product stock is automatically reduced.
    """
    customer = db.get(models.Customer, payload.customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    # Merge duplicate product lines so quantities are validated/charged together.
    requested: dict[int, int] = defaultdict(int)
    for item in payload.items:
        requested[item.product_id] += item.quantity

    # Lock the product rows we are about to modify to avoid race conditions where
    # two concurrent orders both pass the stock check. with_for_update() issues
    # SELECT ... FOR UPDATE on Postgres.
    products: dict[int, models.Product] = {}
    for product_id in requested:
        product = (
            db.query(models.Product)
            .filter(models.Product.id == product_id)
            .with_for_update()
            .first()
        )
        if not product:
            raise HTTPException(
                status_code=404, detail=f"Product id {product_id} not found"
            )
        products[product_id] = product

    # Validate stock for every line BEFORE mutating anything.
    errors = []
    for product_id, qty in requested.items():
        product = products[product_id]
        if product.stock < qty:
            errors.append(
                f"Insufficient stock for '{product.name}' (SKU {product.sku}): "
                f"requested {qty}, available {product.stock}"
            )
    if errors:
        db.rollback()
        raise HTTPException(status_code=422, detail="; ".join(errors))

    # All checks passed — create the order, its items, and reduce stock.
    order = models.Order(customer_id=customer.id, status="PLACED", total_amount=0)
    db.add(order)
    db.flush()  # assign order.id without committing

    total = 0
    for product_id, qty in requested.items():
        product = products[product_id]
        product.stock -= qty  # automatic stock reduction
        line_total = product.price * qty
        total += line_total
        db.add(
            models.OrderItem(
                order_id=order.id,
                product_id=product.id,
                quantity=qty,
                unit_price=product.price,
            )
        )

    order.total_amount = total
    db.commit()

    # Reload with items eagerly for the response.
    db.refresh(order)
    _ = order.items
    return order
