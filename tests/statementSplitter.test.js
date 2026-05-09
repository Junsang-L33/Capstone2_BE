import test from "node:test";
import assert from "node:assert/strict";

import {
  splitIntoStatements,
  splitStatementsWithHints,
} from "../utils/statementSplitter.js";

test("fact emotion need가 섞인 문장을 분리한다", () => {
  const input =
    "어제 너가 약속 시간보다 30분 늦었고 나는 너무 서운했고 다음에는 미리 연락해줬으면 좋겠어.";

  assert.deepEqual(splitIntoStatements(input), [
    "어제 너가 약속 시간보다 30분 늦었어",
    "나는 너무 서운했어",
    "다음에는 미리 연락해줬으면 좋겠어",
  ]);
});

test("해석과 감정을 분리한다", () => {
  const input = "너는 내 말을 진지하게 안 듣는 것 같아서 답답했어";

  assert.deepEqual(splitIntoStatements(input), [
    "너는 내 말을 진지하게 안 듣는 것 같아",
    "답답했어",
  ]);
});

test("강한 접속사를 기준으로 분리한다", () => {
  const input = "나는 서운했어. 근데 다음에는 미리 말해줬으면 좋겠어.";

  assert.deepEqual(splitIntoStatements(input), [
    "나는 서운했어",
    "다음에는 미리 말해줬으면 좋겠어",
  ]);
});

test("힌트와 함께 statement 목록을 반환한다", () => {
  const input = "연락이 없어서 불안했어";
  const results = splitStatementsWithHints(input);

  assert.deepEqual(results, [
    { order: 1, text: "연락이 없었어", hint: "UNKNOWN" },
    { order: 2, text: "불안했어", hint: "EMOTION" },
  ]);
});
