import { authModel } from "../models/authModel.js";
import jwt from "jsonwebtoken";

export async function requireAuth(req, res, next) {
  try {
    const authorizationHeader = req.header("authorization");
    const bearerToken = authorizationHeader?.startsWith("Bearer ")
      ? authorizationHeader.replace(/^Bearer\s+/i, "")
      : authorizationHeader || null;
    const cookieToken = req.cookies?.[process.env.COOKIE_NAME || "tigyeok_session"];
    const token = bearerToken || cookieToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: "AUTH_REQUIRED",
          message: "인증이 필요합니다.",
        },
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.sub;
    const user = await authModel.findById(userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_AUTH",
          message: "유효하지 않은 사용자입니다.",
        },
      });
    }

    req.user = user;
    return next();
  } catch (error) {
    if (
      error instanceof jwt.JsonWebTokenError ||
      error instanceof jwt.TokenExpiredError
    ) {
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_AUTH",
          message: "유효하지 않거나 만료된 토큰입니다.",
        },
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        code: "AUTH_ERROR",
        message: "인증 처리 중 오류가 발생했습니다.",
      },
    });
  }
}
