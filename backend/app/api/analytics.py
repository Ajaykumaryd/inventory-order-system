from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import schemas
from ..core.database import get_db
from ..services import analytics_service

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.post("/query", response_model=schemas.AnalyticsQueryResponse)
def query(payload: schemas.AnalyticsQueryRequest, db: Session = Depends(get_db)):
    """Turn a natural-language question into a chart.

    The LLM returns a read-only SQL query plus a Vega-Lite spec; the SQL is
    validated and run read-only, and the rows are embedded into the spec.
    """
    return analytics_service.generate_dashboard(db, payload)
