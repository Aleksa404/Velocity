import { Router } from "express";
import {
  deleteUser,
  getAllUsers,
  getCurrentUser,
  getUserRole,
  updateUserRole,
} from "../controllers/userController";
import { authenticateToken, requireRole } from "../middleware/authMiddleware";

const router = Router();

router.use(authenticateToken);

router.get("/me", getCurrentUser);
router.get("/role/:id", getUserRole);

router.get("/", requireRole("ADMIN"), getAllUsers);
router.delete("/:id", requireRole("ADMIN"), deleteUser);
router.patch("/role/:id", requireRole("ADMIN"), updateUserRole);

export default router;
