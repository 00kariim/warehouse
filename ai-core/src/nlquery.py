"""
nlquery.py — POST /generate-query

Accepts a natural-language inventory question, generates a SELECT query
using a LangChain agent backed by OpenRouter (Qwen), validates SQL safety,
executes it against the read-only PostgreSQL connection, and returns
structured results (spec §8.3, FR-06).
"""
import logging
import re
import time
from typing import Any, List, Optional

import psycopg2
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage

from .config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

# ── Schema context injected into the LangChain agent's system prompt ──────────
SCHEMA_DDL = """
You are an expert SQL assistant for a warehouse inventory system.
You MUST generate ONLY valid PostgreSQL SELECT statements.
Do NOT generate INSERT, UPDATE, DELETE, DROP, CREATE, ALTER, or any other DDL/DML.
Return results as JSON.

Database schema:

CREATE TABLE users (
    id UUID, username VARCHAR(255), role VARCHAR(20), created_at TIMESTAMP
);
CREATE TABLE products (
    id UUID, sku VARCHAR(100), name VARCHAR(255), description TEXT,
    min_stock INTEGER, current_stock INTEGER, created_at TIMESTAMP, updated_at TIMESTAMP
);
CREATE TABLE warehouses (
    id UUID, name VARCHAR(255), location VARCHAR(255), created_at TIMESTAMP
);
CREATE TABLE stock_movements (
    id UUID, product_id UUID, warehouse_id UUID, user_id UUID,
    quantity INTEGER, type VARCHAR(15), notes TEXT,
    timestamp TIMESTAMP, anomaly_flag BOOLEAN
);
CREATE TABLE anomaly_events (
    id UUID, movement_id UUID, confidence_score DECIMAL(5,4),
    model_version VARCHAR(20), reviewed_by UUID, review_outcome VARCHAR(20),
    created_at TIMESTAMP
);
""".strip()

_llm = None  # Lazy-initialised to avoid import errors when key is missing


def _get_llm():
    global _llm
    if _llm is None:
        _llm = ChatOpenAI(
            model=settings.openrouter_model,
            openai_api_key=settings.openrouter_api_key,
            openai_api_base=settings.openrouter_base_url,
            temperature=0,
            default_headers={
                "HTTP-Referer": "https://warehouse-pfe.local",
                "X-Title": "Warehouse Inventory System",
            },
        )
    return _llm


class QueryRequest(BaseModel):
    prompt: str
    session_id: Optional[str] = None


class QueryResponse(BaseModel):
    sql_executed: str
    results: List[Any]
    row_count: int
    truncated: bool


def _is_safe_sql(sql: str) -> bool:
    """Return True only if the SQL is a plain SELECT statement."""
    stripped = sql.strip().lstrip(";").strip().upper()
    if not stripped.startswith("SELECT"):
        return False
    forbidden = re.compile(
        r"\b(INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|GRANT|REVOKE|EXECUTE|CALL)\b"
    )
    return not bool(forbidden.search(stripped))


def _run_query(sql: str) -> tuple[list[dict], bool]:
    """Execute SQL against the read-only connection; cap at MAX_ROWS / 8 s."""
    conn = psycopg2.connect(
        settings.database_url,
        connect_timeout=settings.nl_query_timeout_secs,
        options=f"-c statement_timeout={settings.nl_query_timeout_secs * 1000}",
    )
    try:
        with conn.cursor() as cur:
            cur.execute(sql)
            columns = [desc[0] for desc in cur.description]
            rows = cur.fetchmany(settings.nl_max_rows + 1)
            truncated = len(rows) > settings.nl_max_rows
            rows = rows[: settings.nl_max_rows]
            return [dict(zip(columns, row)) for row in rows], truncated
    finally:
        conn.close()


@router.post("/generate-query", response_model=QueryResponse)
def generate_query(body: QueryRequest) -> QueryResponse:
    llm = _get_llm()

    # Ask the LLM for a SQL query
    messages = [
        SystemMessage(content=SCHEMA_DDL),
        HumanMessage(
            content=(
                f"Question: {body.prompt}\n\n"
                "Respond with ONLY a valid PostgreSQL SELECT statement and nothing else. "
                "No markdown, no explanation."
            )
        ),
    ]

    try:
        response = llm.invoke(messages)
        sql_raw: str = response.content.strip()
    except Exception as exc:
        logger.error("LLM call failed: %s", exc)
        raise HTTPException(status_code=503, detail=f"LLM call failed: {exc}") from exc

    # Strip accidental markdown fences
    sql_cleaned = re.sub(r"^```(?:sql)?\s*", "", sql_raw, flags=re.IGNORECASE)
    sql_cleaned = re.sub(r"\s*```$", "", sql_cleaned).strip()

    logger.info("Generated SQL for prompt=%r : %s", body.prompt[:80], sql_cleaned[:200])

    if not _is_safe_sql(sql_cleaned):
        logger.warning("Unsafe SQL rejected: %s", sql_cleaned[:200])
        raise HTTPException(
            status_code=422,
            detail={"error": "UNSAFE_QUERY", "message": "Generated SQL is not a SELECT statement"},
        )

    try:
        results, truncated = _run_query(sql_cleaned)
    except psycopg2.OperationalError as exc:
        logger.error("DB query error: %s", exc)
        raise HTTPException(status_code=503, detail=f"Database query failed: {exc}") from exc
    except Exception as exc:
        logger.error("Unexpected query error: %s", exc)
        raise HTTPException(status_code=500, detail="Query execution failed") from exc

    return QueryResponse(
        sql_executed=sql_cleaned,
        results=results,
        row_count=len(results),
        truncated=truncated,
    )
