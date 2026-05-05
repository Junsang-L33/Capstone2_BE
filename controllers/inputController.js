import { inputModel } from "../models/inputModel.js";

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

      const result = await inputModel.submitInput({
        sessionId,
        userId: req.user.id,
        rawText: rawText.trim(),
      });

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