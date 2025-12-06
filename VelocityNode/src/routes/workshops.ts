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


router.use(authenticateToken);


router.get("/my/enrollments", getUserEnrollments);


// Workshop CRUD
router.get("/", getAllWorkshops);
router.get("/:id", getWorkshopById);
router.post("/", createWorkshop);
router.patch("/:id", updateWorkshop);
router.delete("/:id", deleteWorkshop);

// Enrollment
router.post("/:id/enroll", enrollInWorkshop);
router.delete("/:id/enroll", unenrollFromWorkshop);
router.get("/:id/enrollments", getWorkshopEnrollments);

router.patch("/enrollments/:id/approve", approveEnrollment);
router.patch("/enrollments/:id/deny", denyEnrollment);

export default router;
