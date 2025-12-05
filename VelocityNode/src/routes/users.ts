import { Router } from "express";
import {
  deleteUserbyEmail,
  getAllUsers,
  getCurrentUser,
  getUserRole,
  updateUserRole,
} from "../controllers/userController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = Router();

router.use(authenticateToken);

router.get("/me", getCurrentUser);
router.get("/", getAllUsers);
router.delete("/deleteUser/:email", deleteUserbyEmail);

router.patch("/role/:id", updateUserRole);
router.get("/role/:id", getUserRole);

export default router;
