"""HTTP API layer. Aggregates every resource router into a single
``api_router`` that ``app.main`` mounts on the application.
"""

from fastapi import APIRouter

from . import analytics, customers, orders, products

api_router = APIRouter()
api_router.include_router(products.router)
api_router.include_router(customers.router)
api_router.include_router(orders.router)
api_router.include_router(analytics.router)

__all__ = ["api_router"]
