from typing import Any

from pydantic import BaseModel, Field


class AnalyticsQueryRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=1000)


class AnalyticsQueryResponse(BaseModel):
    # The natural-language question that was asked.
    prompt: str
    # The read-only SQL the LLM produced (returned for transparency/debugging).
    sql: str
    # Short natural-language explanation of what the chart shows.
    explanation: str
    # Vega-Lite v5 spec with the query results already embedded under data.values.
    vega_spec: dict[str, Any]
    # Column names and raw rows, in case the client wants a table view.
    columns: list[str]
    data: list[dict[str, Any]]
