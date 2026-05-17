from functools import lru_cache
import os

import joblib

from settings import settings


@lru_cache(maxsize=1)
def load_model():
    if not os.path.exists(settings.model_path):
        raise FileNotFoundError(f"MODEL_PATH does not exist: {settings.model_path}")

    return joblib.load(settings.model_path)


def get_model_classes():
    model = load_model()

    if hasattr(model, "named_steps") and "clf" in model.named_steps:
        return list(model.named_steps["clf"].classes_)

    if hasattr(model, "classes_"):
        return list(model.classes_)

    raise ValueError("Could not determine classifier classes from model.")

