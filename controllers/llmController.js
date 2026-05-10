import OpenAI from "openai";
import { llmModel } from "../models/llmModel.js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 공통 GPT 호출
async function generateText(messages) {
  const response = await openai.chat.completions.create({
    model: "gpt-5.1",
    messages,
    temperature: 0.2,
  });

  return response.choices[0].message.content;
}

export const llmController = {

  // 🔥 핵심 API (mode에 따라 자동 분기)
  async getAnalysis(req, res) {
    try {
      const { sessionId } = req.params;

      const mode = await llmModel.getSessionMode(sessionId);

      if (!mode) {
        return res.status(404).json({
          success: false,
          message: "세션 없음",
        });
      }

      if (mode === "SINGLE") {
        return handleSingleMode(sessionId, res);
      } else {
        return handleDualMode(sessionId, res);
      }

    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "LLM 분석 실패",
      });
    }
  },
};


// 🔵 2인 모드
async function handleDualMode(sessionId, res) {
  try {
    const { aStatements, bStatements } =
      await llmModel.getStatementsBySide(sessionId);

    const tensions = await llmModel.getTensions(sessionId);

    if (!aStatements.length || !bStatements.length) {
      return res.status(404).json({
        success: false,
        message: "양측 데이터 부족",
      });
    }

    const prompt = `
다음은 갈등 분석 데이터입니다.

[갈등 요인]
${tensions.map(t => `- ${t.type}: ${t.rationale}`).join("\n")}

[A 문장]
${aStatements.map(s => "- " + s.text).join("\n")}

[B 문장]
${bStatements.map(s => "- " + s.text).join("\n")}

---

아래 형식을 반드시 그대로 유지하여 출력하세요.

================ 출력 =================

갈등이 가장 컸던 지점
(설명)

AI 요약 및 관점 전환

양측 입장 요약
(요약)

상대방의 언어로 듣기

사용자 B에게 전하는 A의 진짜 마음
"..."

A에게 전하는 사용자 B의 진짜 마음
"..."

요소별 상세 분석

사실
A
(설명)
B
(설명)

해석
A
(설명)
B
(설명)

감정
A
(설명)
B
(설명)

요구
A
(설명)
B
(설명)

함께 생각해볼 질문

1
(질문)

2
(질문)

3
(질문)

=====================================

조건:
- 형식 유지
- 중립적
- 분석 중심
`;

    const resultText = await generateText([
      { role: "system", content: "갈등을 구조적으로 분석하는 전문가" },
      { role: "user", content: prompt },
    ]);

    return res.status(200).json({
      success: true,
      mode: "DUAL",
      data: resultText,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "2인 분석 실패",
    });
  }
}


// 🟢 1인 모드
async function handleSingleMode(sessionId, res) {
  try {
    const { aStatements } =
      await llmModel.getStatementsBySide(sessionId);

    if (!aStatements.length) {
      return res.status(404).json({
        success: false,
        message: "데이터 없음",
      });
    }

    const prompt = `
다음은 한 사람의 생각입니다.

${aStatements.map(s => "- " + s.text).join("\n")}

---

아래 형식으로 정리하세요.

================ 출력 =================

생각 정리 요약
(전체 요약)

요소별 분석

사실
(객관적 사실)

해석
(내 해석)

감정
(느낀 감정)

요구
(바라는 것)

스스로에게 던지는 질문

1
(질문)

2
(질문)

3
(질문)

=====================================

조건:
- 자기 성찰 중심
- 감정 정리
- 중립적
`;

    const resultText = await generateText([
      { role: "system", content: "사용자의 생각을 정리해주는 코치" },
      { role: "user", content: prompt },
    ]);

    return res.status(200).json({
      success: true,
      mode: "SINGLE",
      data: resultText,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "1인 분석 실패",
    });
  }
}