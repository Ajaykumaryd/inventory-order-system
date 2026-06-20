"""Natural-language → SQL + Vega-Lite analytics.

Pipeline:
  1. Describe the database schema (tables, columns, foreign keys) from the
     SQLAlchemy metadata so it always matches the real models.
  2. Ask the LLM for a JSON object: a read-only SQL query + a Vega-Lite spec.
  3. Validate the SQL is a single read-only SELECT.
  4. Execute it inside a READ ONLY transaction with a statement timeout and a
     row cap, then roll back.
  5. Embed the resulting rows into the Vega-Lite spec's ``data.values``.

The LLM output is untrusted, so the SQL safety check + read-only transaction are
the real guard rails — never relax them.
"""

import datetime
import decimal
import json
import re
from typing import Any

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from .. import models, schemas
from ..core.config import settings
from . import llm_service

# Statements that must never appear in an LLM-generated "read" query. Matched as
# whole words, case-insensitively. The READ ONLY transaction is a second layer.
_FORBIDDEN = re.compile(
    r"\b(insert|update|delete|drop|alter|create|truncate|grant|revoke|"
    r"copy|merge|call|do|vacuum|analyze|reindex|comment|attach|pragma)\b",
    re.IGNORECASE,
)


def _build_schema_context() -> str:
    """Render the ORM metadata as a compact text schema for the prompt."""
    lines: list[str] = []
    for table in models.Base.metadata.sorted_tables:
        lines.append(f"TABLE {table.name}")
        for col in table.columns:
            flags = []
            if col.primary_key:
                flags.append("PK")
            if not col.nullable:
                flags.append("NOT NULL")
            for fk in col.foreign_keys:
                flags.append(f"FK -> {fk.column.table.name}.{fk.column.name}")
            suffix = f"  [{', '.join(flags)}]" if flags else ""
            lines.append(f"  - {col.name}: {col.type}{suffix}")
        lines.append("")
    return "\n".join(lines).strip()


_SYSTEM_PROMPT = """\
You are a data analyst for an Inventory & Order Management system backed by \
PostgreSQL. Given the database schema and a user's question, produce a single \
read-only SQL query that answers it and a Vega-Lite v5 specification that \
visualizes the result.

Rules:
- The SQL MUST be a single read-only SELECT statement (a leading WITH ... SELECT \
is allowed). Never write INSERT/UPDATE/DELETE/DDL or multiple statements.
- Use only the tables and columns in the schema below. Use PostgreSQL syntax.
- Prefer aggregations suitable for charting; alias computed columns with clear \
snake_case names.
- The Vega-Lite spec MUST reference the SQL result columns by their aliased \
names in its encodings. Do NOT include a "data" property — the rows are injected \
by the server. Pick an appropriate mark (bar, line, point, arc, etc.).
- Respond with ONLY a JSON object of this exact shape:
  {"sql": "<select ...>", "vega_lite_spec": { ... }, "explanation": "<one sentence>"}

Database schema:
{schema}
"""


def _sanitize_sql(raw: str) -> str:
    sql = raw.strip().rstrip(";").strip()
    if not sql:
        raise HTTPException(status_code=422, detail="LLM produced an empty SQL query.")
    # Reject multiple statements.
    if ";" in sql:
        raise HTTPException(
            status_code=422, detail="Only a single SQL statement is allowed."
        )
    lowered = sql.lstrip("(").lower()
    if not (lowered.startswith("select") or lowered.startswith("with")):
        raise HTTPException(
            status_code=422, detail="Only read-only SELECT queries are allowed."
        )
    if _FORBIDDEN.search(sql):
        raise HTTPException(
            status_code=422,
            detail="Generated query contained a non-read-only keyword and was rejected.",
        )
    return sql


def _jsonable(value: Any) -> Any:
    if isinstance(value, decimal.Decimal):
        return float(value)
    if isinstance(value, (datetime.date, datetime.datetime, datetime.time)):
        return value.isoformat()
    return value


def _run_readonly(db: Session, sql: str) -> tuple[list[str], list[dict[str, Any]]]:
    """Execute SQL in a READ ONLY transaction with a timeout; always roll back."""
    db.rollback()  # ensure we begin a fresh transaction
    try:
        db.execute(text("SET TRANSACTION READ ONLY"))
        db.execute(text(f"SET LOCAL statement_timeout = {int(settings.analytics_timeout_ms)}"))
        result = db.execute(text(sql))
        columns = list(result.keys())
        rows = [
            {k: _jsonable(v) for k, v in row.items()}
            for row in result.mappings().all()[: settings.analytics_row_limit]
        ]
        return columns, rows
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Query execution failed: {exc}")
    finally:
        db.rollback()


def generate_dashboard(
    db: Session, payload: schemas.AnalyticsQueryRequest
) -> schemas.AnalyticsQueryResponse:
    system_prompt = _SYSTEM_PROMPT.replace("{schema}", _build_schema_context())
    raw = llm_service.complete_json(system_prompt, payload.prompt)

    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="LLM did not return valid JSON.")

    sql = _sanitize_sql(str(parsed.get("sql", "")))
    spec = parsed.get("vega_lite_spec") or {}
    if not isinstance(spec, dict):
        raise HTTPException(status_code=502, detail="LLM returned an invalid Vega-Lite spec.")
    explanation = str(parsed.get("explanation", "")).strip()

    columns, rows = _run_readonly(db, sql)

    # Inject the data and make sure the spec is a valid standalone Vega-Lite doc.
    spec.setdefault("$schema", "https://vega.github.io/schema/vega-lite/v5.json")
    spec["data"] = {"values": rows}

    return schemas.AnalyticsQueryResponse(
        prompt=payload.prompt,
        sql=sql,
        explanation=explanation,
        vega_spec=spec,
        columns=columns,
        data=rows,
    )
