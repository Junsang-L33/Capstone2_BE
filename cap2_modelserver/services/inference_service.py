import numpy as np
from fastapi import HTTPException

from services.embedding_service import embed_statements
from services.classifier_service import load_model, get_model_classes
from services.similarity_service import (
    build_tension_candidates,
    collect_unmatched_results,
    cosine_similarity_matrix,
    greedy_align,
)


def _clean_statements(statements):
    cleaned = [statement.strip() for statement in statements if statement and statement.strip()]

    if not cleaned:
        raise HTTPException(
            status_code=400,
            detail="statements must contain at least one non-empty string",
        )

    return cleaned


def _build_statement_results(cleaned, predictions, probabilities, classes):
    results = []
    for index, (text, label, prob) in enumerate(zip(cleaned, predictions, probabilities)):
        prob_dict = {
            class_name: float(score)
            for class_name, score in zip(classes, prob)
        }

        results.append(
            {
                "index": index,
                "text": text,
                "label": str(label),
                "confidence": float(np.max(prob)),
                "probabilities": prob_dict,
            }
        )

    return results


def classify_statements(statements):
    cleaned = _clean_statements(statements)
    model = load_model()
    classes = get_model_classes()
    vectors = embed_statements(cleaned)

    probabilities = model.predict_proba(vectors)
    predictions = model.predict(vectors)

    return _build_statement_results(cleaned, predictions, probabilities, classes)


def analyze_dual_statements(a_statements, b_statements):
    cleaned_a = _clean_statements(a_statements)
    cleaned_b = _clean_statements(b_statements)

    model = load_model()
    classes = get_model_classes()

    a_vectors = embed_statements(cleaned_a)
    b_vectors = embed_statements(cleaned_b)

    a_probabilities = model.predict_proba(a_vectors)
    a_predictions = model.predict(a_vectors)
    b_probabilities = model.predict_proba(b_vectors)
    b_predictions = model.predict(b_vectors)

    a_results = _build_statement_results(
        cleaned_a,
        a_predictions,
        a_probabilities,
        classes,
    )
    b_results = _build_statement_results(
        cleaned_b,
        b_predictions,
        b_probabilities,
        classes,
    )

    similarity_matrix = cosine_similarity_matrix(a_vectors, b_vectors)
    aligned_pairs = greedy_align(a_results, b_results, similarity_matrix)
    a_unmatched_results, b_unmatched_results = collect_unmatched_results(
        a_results,
        b_results,
        aligned_pairs,
    )
    tension_candidates = build_tension_candidates(
        aligned_pairs,
        a_unmatched_results,
        b_unmatched_results,
    )
    common_ground_pairs = [
        pair
        for pair in aligned_pairs
        if pair["pair_type"] in {
            "COMMON_FACT",
            "SHARED_EMOTION",
            "INTERPRETATION_ALIGNMENT",
            "NEED_ALIGNMENT",
        }
    ]

    return {
        "a_results": a_results,
        "b_results": b_results,
        "aligned_pairs": aligned_pairs,
        "a_unmatched_results": a_unmatched_results,
        "b_unmatched_results": b_unmatched_results,
        "common_ground_pairs": common_ground_pairs,
        "tension_candidates": tension_candidates,
        "summary": {
            "a_statement_count": len(a_results),
            "b_statement_count": len(b_results),
            "aligned_pair_count": len(aligned_pairs),
            "a_unmatched_count": len(a_unmatched_results),
            "b_unmatched_count": len(b_unmatched_results),
            "tension_candidate_count": len(tension_candidates),
        },
        "similarity_matrix": similarity_matrix.tolist(),
    }
