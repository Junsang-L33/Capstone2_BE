from typing import Any, Dict, List

from pydantic import BaseModel, Field


class ClassifyRequest(BaseModel):
    statements: List[str] = Field(..., min_length=1)


class DualAnalyzeRequest(BaseModel):
    a_statements: List[str] = Field(..., min_length=1)
    b_statements: List[str] = Field(..., min_length=1)


class StatementResult(BaseModel):
    index: int
    text: str
    label: str
    confidence: float
    probabilities: Dict[str, float]


class AlignedPairResult(BaseModel):
    a_index: int
    b_index: int
    a_text: str
    b_text: str
    a_label: str
    b_label: str
    similarity: float
    pair_type: str


class ClassifyResponse(BaseModel):
    success: bool
    data: Dict[str, List[StatementResult]]


class DualAnalyzeResponse(BaseModel):
    success: bool
    data: Dict[str, Any]


class HealthResponse(BaseModel):
    success: bool
    data: Dict[str, Any]
