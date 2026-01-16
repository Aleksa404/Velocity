import { Router } from "express";
import {
    getSidebar,
    upsertSection,
    deleteSection,
    upsertItem,
    deleteItem,
    reorderSections
} from "../controllers/sidebarController";
import { authenticateToken, requireRole } from "../middleware/authMiddleware";

const router = Router();

router.use(authenticateToken);

// Public
router.get("/", getSidebar);

// Admin only
router.post("/sections", requireRole("ADMIN"), upsertSection);
router.delete("/sections/:id", requireRole("ADMIN"), deleteSection);
router.post("/sections/reorder", requireRole("ADMIN"), reorderSections);

router.post("/items", requireRole("ADMIN"), upsertItem);
router.delete("/items/:id", requireRole("ADMIN"), deleteItem);

export default router;
