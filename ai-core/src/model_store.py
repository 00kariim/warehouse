"""
model_store.py — Thread-safe singleton that holds the loaded Isolation Forest.

A ModelStore instance is created once at application startup and injected
into route handlers via FastAPI Depends. This avoids reloading the model
on every request and allows clean /health status reporting.
"""
import logging
import os
import pickle
from dataclasses import dataclass, field
from typing import Optional, Tuple

from sklearn.ensemble import IsolationForest

logger = logging.getLogger(__name__)


@dataclass
class ModelStore:
    _model: Optional[IsolationForest] = field(default=None, init=False)
    _version: str = field(default="unknown", init=False)

    def load(self, path: str) -> None:
        """Load model from a pickle file produced by seed_model.py."""
        try:
            with open(path, "rb") as f:
                payload = pickle.load(f)
            self._model = payload["model"]
            self._version = payload.get("version", "unknown")
            logger.info("Isolation Forest model v%s loaded from %s", self._version, path)
        except FileNotFoundError:
            logger.error("Model file not found: %s — anomaly detection disabled", path)
        except Exception as exc:
            logger.error("Failed to load model from %s: %s", path, exc)

    def get(self) -> Tuple[Optional[IsolationForest], str]:
        return self._model, self._version

    @property
    def is_ready(self) -> bool:
        return self._model is not None


# ── Application-level singleton ───────────────────────────────────────────────
_store = ModelStore()


def get_model_store() -> ModelStore:
    return _store
