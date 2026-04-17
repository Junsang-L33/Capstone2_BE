import express from "express";

import { authController } from "../controllers/authController.js";

const router = express.Router();

router.get("/google/login", authController.googleLogin);
router.get("/google/callback", authController.googleCallback);

export default router;
