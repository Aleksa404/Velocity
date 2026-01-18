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
    createSection,
    updateSection,
    deleteSection,
    reorderSections,
    uploadWorkshopImage,
} from "../controllers/workshopController";
import { authenticateToken, requireRole } from "../middleware/authMiddleware";
import { workshopImageUpload } from "../utils/uploadConfig";

const router = Router();


router.use(authenticateToken);


router.get("/my/enrollments", getUserEnrollments);
router.get("/my", getMyWorkshops);

// Workshop Image Upload
router.post("/:id/image", requireRole("TRAINER"), workshopImageUpload.single("image"), uploadWorkshopImage);

// Sections
router.post("/:id/sections/reorder", requireRole("TRAINER"), reorderSections);
router.post("/:id/sections", requireRole("TRAINER"), createSection);
router.patch("/sections/:id", requireRole("TRAINER"), updateSection);
router.delete("/sections/:id", requireRole("TRAINER"), deleteSection);


// Enrollment
router.patch("/enrollments/:id/approve", requireRole("TRAINER"), approveEnrollment);
router.patch("/enrollments/:id/deny", requireRole("TRAINER"), denyEnrollment);
router.get("/:id/enrollments", getWorkshopEnrollments);
router.post("/:id/enroll", enrollInWorkshop);
router.delete("/:id/enroll", unenrollFromWorkshop);

// Workshop CRUD
router.get("/", getAllWorkshops);
router.get("/:id", getWorkshopById);
router.post("/", requireRole("TRAINER"), createWorkshop);
router.patch("/:id", requireRole("TRAINER"), updateWorkshop);
router.delete("/:id", requireRole("TRAINER"), deleteWorkshop);


export default router;
