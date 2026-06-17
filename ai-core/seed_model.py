"""
seed_model.py — Generate and persist a synthetic Isolation Forest model.

Run once before first Docker build so models/anomaly_model.pkl exists.
The model is trained on synthetic stock-movement data that mirrors
realistic warehouse distributions as described in spec §8.2.

Usage:
    python seed_model.py
"""
import os
import pickle
import numpy as np
from sklearn.ensemble import IsolationForest

MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
MODEL_PATH = os.path.join(MODEL_DIR, "anomaly_model.pkl")
MODEL_VERSION = "1.0.0"

def generate_training_data(n_samples: int = 5000) -> np.ndarray:
    """
    Generate synthetic features matching the model input spec:
      [quantity, movement_type_encoded, hour_of_day,
       product_avg_daily_volume, quantity_zscore]
    """
    rng = np.random.default_rng(42)

    quantity = rng.exponential(scale=50, size=n_samples).clip(1, 1000).astype(float)
    movement_type = rng.choice([0, 1, 2], size=n_samples, p=[0.4, 0.4, 0.2]).astype(float)
    hour_of_day = rng.integers(0, 24, size=n_samples).astype(float)
    avg_daily_vol = rng.normal(loc=120, scale=30, size=n_samples).clip(0).astype(float)

    std = avg_daily_vol * 0.3 + 1e-6
    quantity_zscore = (quantity - avg_daily_vol) / std

    return np.column_stack([quantity, movement_type, hour_of_day, avg_daily_vol, quantity_zscore])


def train_and_save():
    os.makedirs(MODEL_DIR, exist_ok=True)

    print("[seed_model] Generating synthetic training data …")
    X = generate_training_data()

    print("[seed_model] Training Isolation Forest …")
    model = IsolationForest(
        n_estimators=100,
        contamination=0.05,
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X)

    payload = {"model": model, "version": MODEL_VERSION}
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(payload, f)

    print(f"[seed_model] Model v{MODEL_VERSION} saved → {MODEL_PATH}")


if __name__ == "__main__":
    train_and_save()
