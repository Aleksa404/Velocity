import { Router } from "express";
import {
    createWorkshop,
    getAllWorkshops,
    getWorkshopById,
    updateWorkshop,
    deleteWorkshop,
    enrollInWorkshop,
    getWorkshopEnrollments,
    approveEnrollment,
    denyEnrollment,
    getUserEnrollments,
    unenrollFromWorkshop,
} from "../controllers/workshopController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = Router();

// All routes are protected
router.use(authenticateToken);

// Public routes (now protected)
router.get("/", getAllWorkshops);
router.get("/:id", getWorkshopById);

// Workshop CRUD
router.post("/", createWorkshop);
router.patch("/:id", updateWorkshop);
router.delete("/:id", deleteWorkshop);

// Enrollment
router.post("/:id/enroll", enrollInWorkshop);
router.get("/:id/enrollments", getWorkshopEnrollments);

// Enrollment management
router.patch("/enrollments/:id/approve", approveEnrollment);
router.patch("/enrollments/:id/deny", denyEnrollment);

// User specific routes
router.get("/my/enrollments", getUserEnrollments);
router.delete("/:id/enroll", unenrollFromWorkshop);

export default router;
