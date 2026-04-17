import express from "express";

import { userController } from "../controllers/userController.js";
import { requireAuth } from "../middlewares/auth.js";

const router = express.Router();

router.patch("/me/profile", requireAuth, userController.updateMyProfile);

export default router;

