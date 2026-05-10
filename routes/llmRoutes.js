import express from "express";
import { requireAuth } from "../middlewares/auth.js";
import { llmController } from "../controllers/llmController.js";

const router = express.Router();

router.get("/sessions/:sessionId/analysis", requireAuth, llmController.getAnalysis);

export default router;