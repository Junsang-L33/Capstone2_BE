from fastapi import FastAPI

from schemas import (
    ClassifyRequest,
    ClassifyResponse,
    DualAnalyzeRequest,
    DualAnalyzeResponse,
    HealthResponse,
)
from services.inference_service import analyze_dual_statements, classify_statements
from services.classifier_service import get_model_classes
from settings import settings

app = FastAPI(
    title="Capstone2 FEIN Model Server",
    version="0.1.0",
    description="웹서버가 전달한 statement 배열을 FEIN 분류하는 독립 모델 서버",
)


@app.get("/health", response_model=HealthResponse)
def health():
    return HealthResponse(
        success=True,
        data={
            "status": "ok",
            "model_path": settings.model_path,
            "embedding_model": settings.openai_embedding_model,
            "labels": get_model_classes(),
        },
    )


@app.post("/internal/fein/classify", response_model=ClassifyResponse)
def classify(request: ClassifyRequest):
    results = classify_statements(request.statements)
    return ClassifyResponse(
        success=True,
        data={
            "results": results,
        },
    )


@app.post("/internal/fein/analyze-dual", response_model=DualAnalyzeResponse)
def analyze_dual(request: DualAnalyzeRequest):
    results = analyze_dual_statements(
        request.a_statements,
        request.b_statements,
    )
    return DualAnalyzeResponse(
        success=True,
        data=results,
    )
