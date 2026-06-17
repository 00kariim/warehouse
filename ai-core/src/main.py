"""
main.py — FastAPI application entrypoint for the AI Core service.

On startup the Isolation Forest model is loaded once from MODEL_PATH.
The three routers (/health, /detect-anomaly, /generate-query) are
registered here.
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from .config import settings
from .model_store import get_model_store
from .health import router as health_router
from .anomaly import router as anomaly_router
from .nlquery import router as nlquery_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ──────────────────────────────────────────────────────────────
    store = get_model_store()
    logger.info("Loading Isolation Forest model from %s …", settings.model_path)
    store.load(settings.model_path)

    if store.is_ready:
        _, version = store.get()
        logger.info("AI service ready — model version %s", version)
    else:
        logger.warning("AI service started WITHOUT a valid model — anomaly detection disabled")

    yield
    # ── Shutdown (nothing to clean up) ───────────────────────────────────────


app = FastAPI(
    title="Warehouse AI Core",
    version="1.0.0",
    description="NL2SQL and anomaly detection microservice for the AI-Powered Inventory System",
    lifespan=lifespan,
)

app.include_router(health_router)
app.include_router(anomaly_router)
app.include_router(nlquery_router)
