import express from "express";
import {
  loginUser,
  refresh,
  registerUser,
} from "../controllers/authController";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/refreshToken", refresh);

export default router;
