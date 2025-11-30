import { Router } from "express";
import {
    getAllTrainers,
    getTrainerProfile,
    followTrainer,
    unfollowTrainer,
    getFollowers,
    getFollowing,
} from "../controllers/trainerController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = Router();

// Public routes (no auth required)
router.get("/", getAllTrainers);
router.get("/:id", getTrainerProfile);
router.get("/:id/followers", getFollowers);

// Protected routes (auth required)
router.use(authenticateToken);
router.post("/:id/follow", followTrainer);
router.delete("/:id/follow", unfollowTrainer);
router.get("/me/following", getFollowing);

export default router;
