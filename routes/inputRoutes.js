import express from "express";

import { inputController } from "../controllers/inputController.js";
import { requireAuth } from "../middlewares/auth.js";

const router = express.Router();

router.post("/:sessionId/inputs", requireAuth, inputController.submitInput);

export default router;