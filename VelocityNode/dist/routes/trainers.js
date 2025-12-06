"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const trainerController_1 = require("../controllers/trainerController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticateToken);
router.get("/", trainerController_1.getAllTrainers);
router.get("/:id", trainerController_1.getTrainerProfile);
router.get("/:id/followers", trainerController_1.getFollowers);
router.post("/:id/follow", trainerController_1.followTrainer);
router.delete("/:id/follow", trainerController_1.unfollowTrainer);
router.get("/me/following", trainerController_1.getFollowing);
exports.default = router;
//# sourceMappingURL=trainers.js.map