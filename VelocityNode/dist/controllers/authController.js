"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refresh = exports.logout = exports.loginUser = exports.registerUser = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const client_1 = require("@prisma/client");
const authValidation_schema_1 = require("../utils/authValidation.schema");
const generateToken_1 = require("../utils/generateToken");
const prisma = new client_1.PrismaClient();
const registerUser = async (req, res) => {
    console.log("Registering user:", req.body);
    const result = authValidation_schema_1.registerUserSchema.safeParse(req.body);
    if (!result.success) {
        const formatetErrors = result.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
        }));
        return res.status(400).json({
            success: false,
            data: null,
            errors: formatetErrors,
        });
    }
    const { email, password } = req.body;
    const exists = await prisma.user.findUnique({ where: { email: email } });
    if (exists)
        return res.status(400).json({
            success: false,
            data: null,
            message: "Email already exists",
        });
    const hashedPassword = await bcrypt_1.default.hash(password, 10);
    const user = await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            first_name: req.body.firstName,
            last_name: req.body.lastName || "",
            role: "USER",
        },
    });
    const accessToken = (0, generateToken_1.generateAccessToken)({
        id: user.id,
        email: user.email,
        role: user.role,
    });
    const refreshToken = await (0, generateToken_1.generateRefreshToken)(user.id);
    const responseUser = {
        id: user.id,
        email: user.email,
        firstName: user?.first_name,
        lastName: user?.last_name,
        role: user?.role,
        createdAt: user?.createdAt,
        updatedAt: user?.updatedAt,
    };
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res.status(201).json({
        success: true,
        data: { accessToken, user: responseUser },
        message: "User registered successfully",
    });
};
exports.registerUser = registerUser;
const loginUser = async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user)
        return res.status(401).json({ message: "Invalid credentials" });
    const isMatch = await bcrypt_1.default.compare(password, user.password);
    if (!isMatch)
        return res.status(401).json({ message: "Invalid credentials" });
    const responseUser = {
        id: user.id,
        email: user.email,
        firstName: user?.first_name,
        lastName: user?.last_name,
        role: user?.role,
        createdAt: user?.createdAt,
        updatedAt: user?.updatedAt,
    };
    const accessToken = (0, generateToken_1.generateAccessToken)({
        id: user.id,
        email: user.email,
        role: user.role,
    });
    const refreshToken = await (0, generateToken_1.generateRefreshToken)(user.id);
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });
    return res.status(200).json({
        success: true,
        data: { accessToken, user: responseUser },
        message: "Login successful",
    });
};
exports.loginUser = loginUser;
const logout = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (refreshToken) {
            await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
        }
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
        });
        return res
            .status(204)
            .json({ success: true, message: "Logged out successfully" });
    }
    catch (error) {
        return res
            .status(500)
            .json({ success: false, message: "Internal server error" });
    }
};
exports.logout = logout;
const refresh = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        return res.status(401).json({ error: "No refresh token provided" });
    }
    try {
        const { userId, refreshToken: newRefreshToken } = await (0, generateToken_1.rotateRefreshToken)(refreshToken);
        const user = await prisma.user.findUnique({ where: { id: userId } });
        const accessToken = (0, generateToken_1.generateAccessToken)({
            id: userId,
            email: user?.email,
            role: user?.role,
        });
        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 30 * 24 * 60 * 60 * 1000, //30 days
        });
        res.json({ accessToken, user });
    }
    catch (error) {
        return res.status(401).json({ error: error.message });
    }
};
exports.refresh = refresh;
//# sourceMappingURL=authController.js.map