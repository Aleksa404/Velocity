"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const trainerRequestController_1 = require("../controllers/trainerRequestController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticateToken);
// User routes
router.post("/", trainerRequestController_1.createTrainerRequest);
router.get("/my-request", trainerRequestController_1.getUserTrainerRequest);
// Admin routes 
router.get("/", trainerRequestController_1.getAllTrainerRequests);
router.get("/pending", trainerRequestController_1.getPendingTrainerRequests);
router.patch("/:id/approve", trainerRequestController_1.approveTrainerRequest);
router.patch("/:id/deny", trainerRequestController_1.denyTrainerRequest);
exports.default = router;
//# sourceMappingURL=trainerRequests.js.map