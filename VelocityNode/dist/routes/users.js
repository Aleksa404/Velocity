"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticateToken);
router.get("/me", userController_1.getCurrentUser);
router.get("/", userController_1.getAllUsers);
router.delete("/deleteUser/:email", userController_1.deleteUserbyEmail);
router.patch("/role/:id", userController_1.updateUserRole);
router.get("/role/:id", userController_1.getUserRole);
exports.default = router;
//# sourceMappingURL=users.js.map