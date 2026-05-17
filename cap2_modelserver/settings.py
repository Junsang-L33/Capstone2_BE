import os

from dotenv import load_dotenv

load_dotenv()


class Settings:
    def __init__(self):
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        self.openai_embedding_model = os.getenv(
            "OPENAI_EMBEDDING_MODEL",
            "text-embedding-3-small",
        )
        self.model_path = os.getenv("MODEL_PATH", "./fein_classifier.joblib")
        self.dual_similarity_threshold = float(
            os.getenv("DUAL_SIMILARITY_THRESHOLD", "0.35")
        )


settings = Settings()
