"""
anomaly.py — POST /detect-anomaly

Receives a stock movement payload, encodes features, and runs
the pre-loaded Isolation Forest model to determine whether the
movement is anomalous (spec §8.2).
"""
import logging
from typing import Literal

import numpy as np
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from .model_store import ModelStore, get_model_store

logger = logging.getLogger(__name__)
router = APIRouter()

MOVEMENT_TYPE_ENCODING: dict[str, int] = {"IN": 0, "OUT": 1, "ADJUSTMENT": 2}


class AnomalyRequest(BaseModel):
    product_id: str
    quantity: float = Field(..., description="Movement quantity (absolute value)")
    type: Literal["IN", "OUT", "ADJUSTMENT"]
    hour_of_day: int = Field(..., ge=0, le=23)
    product_avg_daily_volume: float = Field(0.0, ge=0)
    quantity_zscore: float = 0.0


class AnomalyResponse(BaseModel):
    is_anomaly: bool
    confidence_score: float
    model_version: str


@router.post("/detect-anomaly", response_model=AnomalyResponse)
def detect_anomaly(
    body: AnomalyRequest,
    store: ModelStore = Depends(get_model_store),
) -> AnomalyResponse:
    model, version = store.get()
    if model is None:
        raise HTTPException(status_code=503, detail="Isolation Forest model not loaded")

    type_encoded = MOVEMENT_TYPE_ENCODING.get(body.type, 0)

    features = np.array([[
        body.quantity,
        float(type_encoded),
        float(body.hour_of_day),
        body.product_avg_daily_volume,
        body.quantity_zscore,
    ]])

    # IsolationForest: -1 = anomaly, 1 = normal
    prediction = model.predict(features)[0]
    is_anomaly = bool(prediction == -1)

    # score_samples returns raw anomaly score; map to [0,1] confidence
    raw_score = float(model.score_samples(features)[0])
    # score_samples ∈ (-∞, 0]; more negative = more anomalous
    # Normalise: confidence = clip(1 - (score + 0.5), 0, 1)
    confidence = float(min(max(1.0 - (raw_score + 0.5), 0.0), 1.0))

    logger.info(
        "anomaly_check product=%s quantity=%s type=%s is_anomaly=%s confidence=%.4f",
        body.product_id, body.quantity, body.type, is_anomaly, confidence,
    )

    return AnomalyResponse(
        is_anomaly=is_anomaly,
        confidence_score=round(confidence, 4),
        model_version=version,
    )
