"""Optional seed script to populate sample data.

Run inside the backend container:
    docker compose exec backend python -m app.seed
"""

from .core.database import SessionLocal, engine
from .models import Base, Customer, Product


def run():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(Product).count() > 0:
            print("Data already present, skipping seed.")
            return

        products = [
            Product(sku="SKU-001", name="Wireless Mouse", price=19.99, stock=50,
                    description="Ergonomic 2.4GHz wireless mouse"),
            Product(sku="SKU-002", name="Mechanical Keyboard", price=79.50, stock=30,
                    description="RGB mechanical keyboard, blue switches"),
            Product(sku="SKU-003", name="USB-C Hub", price=34.00, stock=15,
                    description="7-in-1 USB-C hub"),
            Product(sku="SKU-004", name="27\" Monitor", price=229.99, stock=8,
                    description="27 inch 1440p IPS monitor"),
        ]
        customers = [
            Customer(name="Alice Johnson", email="alice@example.com",
                     phone="555-0101", address="12 Maple St"),
            Customer(name="Bob Smith", email="bob@example.com",
                     phone="555-0102", address="34 Oak Ave"),
        ]
        db.add_all(products + customers)
        db.commit()
        print("Seeded sample products and customers.")
    finally:
        db.close()


if __name__ == "__main__":
    run()
