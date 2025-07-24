import { Router } from "express";
import {
  deleteUserbyEmail,
  getAllUsers,
  getCurrentUser,
  getUserRole,
  updateUserRole,
} from "../controllers/userController";

const router = Router();

router.get("/me", getCurrentUser);

router.get("/", getAllUsers);

router.delete("/deleteUser/:email", deleteUserbyEmail);

router.patch("/role/:id", updateUserRole);

router.get("/role/:id", getUserRole);

export default router;
