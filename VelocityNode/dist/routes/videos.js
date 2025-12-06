"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const videoController_1 = require("../controllers/videoController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const videoProgressController_1 = require("../controllers/videoProgressController");
const multer_1 = __importDefault(require("multer"));
const router = express_1.default.Router();
router.use(authMiddleware_1.authenticateToken);
const upload = (0, multer_1.default)({ dest: "uploads/" });
const multerUploadMiddleware = upload.single("video");
router.get("/", videoController_1.getVideos);
// Protected route for trainers to post videos
router.post("/", (0, authMiddleware_1.requireRole)("TRAINER"), multerUploadMiddleware, videoController_1.createVideo);
router.delete("/:id", (0, authMiddleware_1.requireRole)("TRAINER"), videoController_1.deleteVideo);
// Video progress tracking routes
router.post("/:id/progress", videoProgressController_1.updateVideoProgress);
router.get("/:id/progress", videoProgressController_1.getVideoProgress);
router.post("/:id/complete", videoProgressController_1.markVideoComplete);
router.get("/my/continue-watching", videoProgressController_1.getContinueWatching);
router.get("/my/watch-history", videoProgressController_1.getWatchHistory);
exports.default = router;
//# sourceMappingURL=videos.js.map