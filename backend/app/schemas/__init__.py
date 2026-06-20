"""Pydantic request/response schemas, re-exported so callers can keep using
``schemas.ProductOut`` etc. regardless of the module a schema lives in.
"""

from .analytics import AnalyticsQueryRequest, AnalyticsQueryResponse
from .customer import CustomerBase, CustomerCreate, CustomerOut, CustomerUpdate
from .order import (
    OrderCreate,
    OrderItemCreate,
    OrderItemOut,
    OrderOut,
)
from .product import ProductBase, ProductCreate, ProductOut, ProductUpdate

__all__ = [
    "AnalyticsQueryRequest",
    "AnalyticsQueryResponse",
    "CustomerBase",
    "CustomerCreate",
    "CustomerOut",
    "CustomerUpdate",
    "OrderCreate",
    "OrderItemCreate",
    "OrderItemOut",
    "OrderOut",
    "ProductBase",
    "ProductCreate",
    "ProductOut",
    "ProductUpdate",
]
