"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = void 0;
exports.requireRole = requireRole;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.sendStatus(401);
    }
    const token = authHeader.split(" ")[1];
    try {
        console.log("Verifying token:", token);
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        if (typeof decoded === "string") {
            return res.status(401).json({ message: "Invalid token payload" });
        }
        req.user = decoded;
        console.log("Token verified successfully:", decoded);
        next();
    }
    catch (error) {
        console.error("JWT verification failed:", error.message);
        console.error("Token that failed:", token);
        console.error("JWT_SECRET exists:", !!process.env.JWT_SECRET);
        return res.status(401).json({
            message: "Invalid or expired token",
            error: error.message
        });
    }
};
exports.authenticateToken = authenticateToken;
function requireRole(requiredRole) {
    return async (req, res, next) => {
        try {
            const { id, role } = req.user;
            console.log(req.user);
            if (!id) {
                return res
                    .status(401)
                    .json({ message: "Unauthorized: Missing userId" });
            }
            const prisma = new client_1.PrismaClient();
            const user = await prisma.user.findUnique({
                where: { id: id },
            });
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            if (user.role !== requiredRole) {
                return res.status(403).json({ message: "Access denied" });
            }
            next();
        }
        catch (error) {
            console.error("Error in requireRole middleware:", error);
            return res.status(500).json({ error: "Internal server error" });
        }
    };
}
//# sourceMappingURL=authMiddleware.js.map