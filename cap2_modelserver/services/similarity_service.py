import numpy as np

from settings import settings


NEGATION_PATTERNS = [
    "안 ",
    "못 ",
    "아니",
    "없",
    "않",
    "말아",
]


def cosine_similarity_matrix(a_vectors, b_vectors):
    a_norm = np.linalg.norm(a_vectors, axis=1, keepdims=True)
    b_norm = np.linalg.norm(b_vectors, axis=1, keepdims=True)

    a_safe = a_vectors / np.clip(a_norm, 1e-12, None)
    b_safe = b_vectors / np.clip(b_norm, 1e-12, None)

    return np.matmul(a_safe, b_safe.T)


def contains_negation(text):
    return any(pattern in text for pattern in NEGATION_PATTERNS)


def infer_pair_type(a_result, b_result):
    a_label = a_result["label"]
    b_label = b_result["label"]

    if a_label == "FACT" and b_label == "FACT":
        if contains_negation(a_result["text"]) != contains_negation(b_result["text"]):
            return "CONFLICTING_FACT_CLAIM"
        return "COMMON_FACT"

    if a_label == "EMOTION" and b_label == "EMOTION":
        return "SHARED_EMOTION"

    if a_label == "INTERPRETATION" and b_label == "INTERPRETATION":
        return "INTERPRETATION_ALIGNMENT"

    if a_label == "NEED" and b_label == "NEED":
        return "NEED_ALIGNMENT"

    if {a_label, b_label} == {"FACT", "INTERPRETATION"}:
        return "FACT_INTERPRETATION_CROSS"

    if {a_label, b_label} == {"EMOTION", "NEED"}:
        return "EMOTION_NEED_CROSS"

    return "CROSS_LABEL"


def greedy_align(a_results, b_results, similarity_matrix):
    candidates = []

    for a_index, a_result in enumerate(a_results):
        for b_index, b_result in enumerate(b_results):
            similarity = float(similarity_matrix[a_index, b_index])
            if similarity < settings.dual_similarity_threshold:
                continue

            candidates.append(
                {
                    "a_index": a_index,
                    "b_index": b_index,
                    "similarity": similarity,
                    "pair_type": infer_pair_type(a_result, b_result),
                }
            )

    candidates.sort(key=lambda item: item["similarity"], reverse=True)

    used_a = set()
    used_b = set()
    aligned_pairs = []

    for candidate in candidates:
        if candidate["a_index"] in used_a or candidate["b_index"] in used_b:
            continue

        a_result = a_results[candidate["a_index"]]
        b_result = b_results[candidate["b_index"]]

        aligned_pairs.append(
            {
                "a_index": candidate["a_index"],
                "b_index": candidate["b_index"],
                "a_text": a_result["text"],
                "b_text": b_result["text"],
                "a_label": a_result["label"],
                "b_label": b_result["label"],
                "similarity": candidate["similarity"],
                "pair_type": candidate["pair_type"],
            }
        )

        used_a.add(candidate["a_index"])
        used_b.add(candidate["b_index"])

    return aligned_pairs


def collect_unmatched_results(a_results, b_results, aligned_pairs):
    matched_a = {pair["a_index"] for pair in aligned_pairs}
    matched_b = {pair["b_index"] for pair in aligned_pairs}

    a_unmatched = [
        result
        for result in a_results
        if result["index"] not in matched_a
    ]
    b_unmatched = [
        result
        for result in b_results
        if result["index"] not in matched_b
    ]

    return a_unmatched, b_unmatched


def _append_tension(candidates, tension_type, rationale, evidence):
    existing = next(
        (candidate for candidate in candidates if candidate["type"] == tension_type),
        None,
    )

    if existing:
        existing["evidence"].extend(evidence)
        return

    candidates.append(
        {
            "type": tension_type,
            "rationale": rationale,
            "evidence": evidence,
        }
    )


def build_tension_candidates(aligned_pairs, a_unmatched_results, b_unmatched_results):
    candidates = []

    for pair in aligned_pairs:
        evidence = [
            {
                "a_index": pair["a_index"],
                "b_index": pair["b_index"],
                "pair_type": pair["pair_type"],
                "similarity": pair["similarity"],
            }
        ]

        if pair["pair_type"] == "CONFLICTING_FACT_CLAIM":
            _append_tension(
                candidates,
                "FACT_CONFLICT",
                "유사한 사실 진술이 정렬됐지만 부정 또는 상충 표현이 달라 사실 인식 충돌 가능성이 있습니다.",
                evidence,
            )
            continue

        if pair["pair_type"] == "FACT_INTERPRETATION_CROSS":
            _append_tension(
                candidates,
                "PERSPECTIVE_GAP",
                "한쪽은 사실을 말하고 다른 한쪽은 해석을 말해 관점 차이가 핵심 긴장일 수 있습니다.",
                evidence,
            )
            continue

        if pair["pair_type"] == "EMOTION_NEED_CROSS":
            _append_tension(
                candidates,
                "EMOTION_NEED_GAP",
                "한쪽의 감정 표현과 다른 한쪽의 요구 표현이 맞물려 충족되지 않은 필요가 긴장으로 이어질 수 있습니다.",
                evidence,
            )
            continue

        if pair["pair_type"] == "CROSS_LABEL":
            _append_tension(
                candidates,
                "LABEL_MISMATCH",
                "유사한 주제를 다루지만 FEIN 라벨이 달라 대화 초점이 어긋나 있을 가능성이 있습니다.",
                evidence,
            )

    unmatched_need_evidence = []
    for side, results in (("A", a_unmatched_results), ("B", b_unmatched_results)):
        for result in results:
            if result["label"] != "NEED":
                continue
            unmatched_need_evidence.append(
                {
                    "side": side,
                    "statement_index": result["index"],
                    "label": result["label"],
                    "text": result["text"],
                }
            )

    if unmatched_need_evidence:
        _append_tension(
            candidates,
            "UNADDRESSED_NEEDS",
            "정렬되지 않은 요구 statement가 남아 있어 아직 직접 다뤄지지 않은 필요가 있을 수 있습니다.",
            unmatched_need_evidence,
        )

    unmatched_interpretation_evidence = []
    for side, results in (("A", a_unmatched_results), ("B", b_unmatched_results)):
        for result in results:
            if result["label"] != "INTERPRETATION":
                continue
            unmatched_interpretation_evidence.append(
                {
                    "side": side,
                    "statement_index": result["index"],
                    "label": result["label"],
                    "text": result["text"],
                }
            )

    if unmatched_interpretation_evidence:
        _append_tension(
            candidates,
            "INTERPRETATION_GAP",
            "정렬되지 않은 해석 statement가 남아 있어 서로의 의미 해석이 충분히 맞물리지 않을 수 있습니다.",
            unmatched_interpretation_evidence,
        )

    return candidates
