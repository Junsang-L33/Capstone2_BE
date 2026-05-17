# cap2_modelserver

웹서버가 `모더레이션`과 `statement 분해`까지 끝낸 뒤, `statements` 배열을 넘기면
이 서버가 `임베딩 -> FEIN 분류`를 수행하고 결과를 반환합니다.

2인 모드에서는 양측 statement를 받아 `FEIN 분류 + 코사인 유사도 + 정렬 결과`까지 반환합니다.

## 역할

- 입력: `statements: string[]`
- 처리:
  - `text-embedding-3-small` 임베딩 생성
  - 저장된 FEIN 분류 모델 추론
  - 2인 모드일 경우 A/B 간 코사인 유사도 계산
  - 2인 모드일 경우 정렬 결과 생성
- 출력:
  - `text`
  - `label`
  - `confidence`
  - `probabilities`

## 디렉토리 구조

```txt
cap2_modelserver/
  app.py
  settings.py
  schemas.py
  requirements.txt
  services/
    embedding_service.py
    classifier_service.py
    inference_service.py
```

## 설치

```bash
cd /Users/leejunsang/Desktop/cap2_modelserver
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## 환경변수

```bash
export OPENAI_API_KEY="your-openai-api-key"
export OPENAI_EMBEDDING_MODEL="text-embedding-3-small"
export MODEL_PATH="/absolute/path/to/fein_classifier_full_sentence.joblib"
export DUAL_SIMILARITY_THRESHOLD="0.35"
```

## 실행

```bash
cd /Users/leejunsang/Desktop/cap2_modelserver
source .venv/bin/activate
uvicorn app:app --host 0.0.0.0 --port 8000
```

## 엔드포인트

### `GET /health`

모델 경로, 라벨 목록, 임베딩 모델명을 확인합니다.

### `POST /internal/fein/classify`

요청:

```json
{
  "statements": [
    "어제 너가 약속 시간보다 30분 늦었어",
    "나는 너무 서운했어",
    "다음에는 미리 연락해줬으면 좋겠어"
  ]
}
```

### `POST /internal/fein/analyze-dual`

요청:

```json
{
  "a_statements": [
    "어제 너가 약속 시간보다 30분 늦었어",
    "나는 너무 서운했어"
  ],
  "b_statements": [
    "늦은 건 맞아",
    "나도 미안했어"
  ]
}
```

응답:

```json
{
  "success": true,
  "data": {
    "a_results": [],
    "b_results": [],
    "aligned_pairs": [],
    "similarity_matrix": []
  }
}
```

응답:

```json
{
  "success": true,
  "data": {
    "results": [
      {
        "text": "어제 너가 약속 시간보다 30분 늦었어",
        "label": "FACT",
        "confidence": 0.99,
        "probabilities": {
          "EMOTION": 0.0,
          "FACT": 0.99,
          "INTERPRETATION": 0.0,
          "NEED": 0.0
        }
      }
    ]
  }
}
```

## 웹서버와 연결 방식

1. 웹서버가 원문 입력 수신
2. 웹서버가 모더레이션 수행
3. 웹서버가 statement 분해
4. 1인 모드면 이 서버에 `statements` 배열 전달
5. 2인 모드면 이 서버에 `a_statements`, `b_statements` 전달
6. 이 서버가 분류 결과 또는 정렬 결과 반환
7. 웹서버가 DB 저장 및 후속 분석 수행
