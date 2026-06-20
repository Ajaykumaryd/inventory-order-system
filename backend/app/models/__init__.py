"""ORM models package.

Importing every model here registers it on the shared ``Base`` and re-exports
the classes so callers can keep using ``models.Product`` etc.
"""

from .base import Base
from .customer import Customer
from .order import Order, OrderItem
from .product import Product

__all__ = ["Base", "Customer", "Order", "OrderItem", "Product"]
