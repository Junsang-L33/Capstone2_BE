import OpenAI from "openai";

import { inputModel } from "../models/inputModel.js";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODERATION_MODEL =
  process.env.OPENAI_MODERATION_MODEL || "omni-moderation-latest";

async function moderateText(input) {
  const response = await client.moderations.create({
    model: MODERATION_MODEL,
    input,
  });

  const result = response.results[0];

  return {
    flagged: result.flagged,
    categories: result.categories,
    category_scores: result.category_scores,
  };
}

export const inputController = {
  async submitInput(req, res) {
    try {
      const { sessionId } = req.params;
      const { rawText } = req.body;

      if (!rawText || typeof rawText !== "string" || rawText.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "rawText는 필수입니다.",
          },
        });
      }

      const cleanedText = rawText.trim();

      const moderationResult = await moderateText(cleanedText);

      if (moderationResult.flagged) {
        await inputModel.blockSession({ sessionId });

        return res.status(400).json({
          success: false,
          error: {
            code: "INPUT_BLOCKED",
            message: "위험 신호가 감지되어 입력이 차단되었습니다.",
            details: moderationResult,
          },
        });
      }

      const result = await inputModel.submitInput({
        sessionId,
        userId: req.user.id,
        rawText: cleanedText,
      });
      
      // TODO:
      // AI 분석 파이프라인 연결 예정
      // 1. rawText → statement 단위 분해
      // 2. FastAPI 모델 서버 호출
      // 3. FEIN 분류 결과 수신
      // 4. statements 테이블 저장
      // 5. 이후 Alignment / Tension / GeneratedText 생성 단계 연결

      return res.status(201).json({
        success: true,
        message: "입력이 저장되었습니다.",
        data: result,
      });
    } catch (error) {
      if (error.message === "SESSION_NOT_FOUND") {
        return res.status(404).json({
          success: false,
          error: { code: "SESSION_NOT_FOUND", message: "세션을 찾을 수 없습니다." },
        });
      }

      if (error.message === "NOT_PARTICIPANT") {
        return res.status(403).json({
          success: false,
          error: { code: "NOT_PARTICIPANT", message: "해당 세션 참여자가 아닙니다." },
        });
      }

      if (error.message === "INPUT_ALREADY_SUBMITTED") {
        return res.status(409).json({
          success: false,
          error: { code: "INPUT_ALREADY_SUBMITTED", message: "이미 입력을 제출했습니다." },
        });
      }

      return res.status(500).json({
        success: false,
        error: {
          code: "INPUT_SUBMIT_FAILED",
          message: "입력 저장 중 오류가 발생했습니다.",
        },
      });
    }
  },
};