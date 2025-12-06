import { Router } from "express";
import {
    getAllTrainers,
    getTrainerProfile,
    followTrainer,
    unfollowTrainer,
    getFollowers,
    getFollowing,
    searchTrainers,
} from "../controllers/trainerController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = Router();

router.use(authenticateToken);



router.get("/search", searchTrainers);
router.get("/", getAllTrainers);
router.get("/:id", getTrainerProfile);
router.get("/:id/followers", getFollowers);

router.post("/:id/follow", followTrainer);
router.delete("/:id/follow", unfollowTrainer);
router.get("/me/following", getFollowing);

export default router;
