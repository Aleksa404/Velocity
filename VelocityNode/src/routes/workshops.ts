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
    getMyWorkshops,
} from "../controllers/workshopController";
import { authenticateToken, requireRole } from "../middleware/authMiddleware";

const router = Router();


router.use(authenticateToken);


router.get("/my/enrollments", getUserEnrollments);
router.get("/my", getMyWorkshops);


// Workshop CRUD
router.get("/", getAllWorkshops);
router.get("/:id", getWorkshopById);
router.post("/", requireRole("TRAINER"), createWorkshop);
router.patch("/:id", requireRole("TRAINER"), updateWorkshop);
router.delete("/:id", requireRole("TRAINER"), deleteWorkshop);

// Enrollment
router.post("/:id/enroll", enrollInWorkshop);
router.delete("/:id/enroll", unenrollFromWorkshop);
router.get("/:id/enrollments", getWorkshopEnrollments);

router.patch("/enrollments/:id/approve", requireRole("TRAINER"), approveEnrollment);
router.patch("/enrollments/:id/deny", requireRole("TRAINER"), denyEnrollment);

export default router;
