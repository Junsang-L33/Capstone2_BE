from openai import OpenAI
import numpy as np

from settings import settings

_client = None


def get_openai_client():
    global _client

    if _client is None:
        if not settings.openai_api_key:
            raise RuntimeError("OPENAI_API_KEY is required.")

        _client = OpenAI(api_key=settings.openai_api_key)

    return _client


def embed_statements(statements):
    client = get_openai_client()
    response = client.embeddings.create(
        model=settings.openai_embedding_model,
        input=statements,
    )

    vectors = [item.embedding for item in response.data]
    return np.asarray(vectors, dtype=np.float32)

