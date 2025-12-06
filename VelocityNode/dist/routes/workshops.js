"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const workshopController_1 = require("../controllers/workshopController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticateToken);
router.get("/my/enrollments", workshopController_1.getUserEnrollments);
router.get("/", workshopController_1.getAllWorkshops);
router.get("/:id", workshopController_1.getWorkshopById);
// Workshop CRUD
router.post("/", workshopController_1.createWorkshop);
router.patch("/:id", workshopController_1.updateWorkshop);
router.delete("/:id", workshopController_1.deleteWorkshop);
// Enrollment
router.post("/:id/enroll", workshopController_1.enrollInWorkshop);
router.delete("/:id/enroll", workshopController_1.unenrollFromWorkshop);
router.get("/:id/enrollments", workshopController_1.getWorkshopEnrollments);
// Enrollment management
router.patch("/enrollments/:id/approve", workshopController_1.approveEnrollment);
router.patch("/enrollments/:id/deny", workshopController_1.denyEnrollment);
exports.default = router;
//# sourceMappingURL=workshops.js.map