"""
health.py — GET /health

Returns service readiness based on whether the Isolation Forest
model has been loaded successfully (spec §8.4, NFR-03).
"""
from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse

from .model_store import ModelStore, get_model_store

router = APIRouter()


@router.get("/health")
def health(store: ModelStore = Depends(get_model_store)):
    _, version = store.get()
    if store.is_ready:
        return {"status": "ok", "model_version": version}
    return JSONResponse(
        status_code=503,
        content={"status": "unavailable", "reason": "Isolation Forest model not loaded"},
    )
