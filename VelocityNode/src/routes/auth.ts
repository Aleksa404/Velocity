import express from "express";
import {
  loginUser,
  logout,
  refresh,
  registerUser,
} from "../controllers/authController";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logout);
router.post("/refreshToken", refresh);

export default router;
