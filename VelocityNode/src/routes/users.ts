import { Router } from "express";
import {
  deleteUserbyEmail,
  getAllUsers,
  getCurrentUser,
  getUserRole,
  updateUserRole,
} from "../controllers/userController";
import { PrismaClient } from "@prisma/client";
import { authenticateToken } from "../middleware/authMiddleware";

const router = Router();
const prisma = new PrismaClient();

router.get("/me", getCurrentUser);

router.get("/", getAllUsers);

//router.post("/createUser", createUser);

router.delete("/deleteUser/:email", deleteUserbyEmail);

router.patch("/role/:id", updateUserRole);

router.get("/role/:id", getUserRole);

export default router;
