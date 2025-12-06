"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentUser = exports.updateUserRole = exports.getUserRole = exports.deleteUserbyEmail = exports.getAllUsers = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getAllUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany();
        res.status(200).json(users);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch users" });
    }
};
exports.getAllUsers = getAllUsers;
const deleteUserbyEmail = async (req, res) => {
    const { email } = req.params;
    try {
        const deletedUser = await prisma.user.delete({
            where: {
                email: email,
            },
        });
        res.status(200).json(deletedUser);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to delete user" });
    }
};
exports.deleteUserbyEmail = deleteUserbyEmail;
const getUserRole = async (req, res) => {
    const { id } = req.params;
    try {
        const userRole = await prisma.user.findUnique({
            where: { id: id },
            select: { role: true },
        });
        if (!userRole) {
            const response = {
                success: false,
                data: null,
                message: "User not found",
            };
            return res.status(404).json(response);
        }
        const response = {
            success: true,
            data: userRole?.role || null,
            message: "User role fetched successfully",
        };
        res.status(200).json(response);
    }
    catch (error) {
        const response = {
            success: false,
            data: null,
            message: error.message || "Failed to fetch user role",
        };
        res.status(500).json(response);
    }
};
exports.getUserRole = getUserRole;
const updateUserRole = async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    console.log("Updating user role for ID:", id, "to role:", role);
    try {
        const updatedUser = await prisma.user.update({
            where: { id: id },
            data: { role: role },
        });
        const response = {
            success: true,
            data: updatedUser,
            message: "User role updated successfully",
        };
        res.status(200).json(response);
    }
    catch (error) {
        const response = {
            success: false,
            data: null,
            message: error.message || "Failed to update user role",
        };
        res.status(500).json(response);
    }
};
exports.updateUserRole = updateUserRole;
const getCurrentUser = async (req, res) => {
    console.log("ovde");
    try {
        const { id } = req.user;
        if (!id) {
            return res.status(401).json({ message: "Unauthorized: Missing userId" });
        }
        const currentUser = await prisma.user.findUnique({ where: { id } });
        if (!currentUser)
            return res.status(404).json("user not found");
        const responseUser = {
            id: currentUser.id,
            email: currentUser.email,
            firstName: currentUser?.first_name,
            lastName: currentUser?.last_name,
            role: currentUser?.role,
            createdAt: currentUser?.createdAt,
            updatedAt: currentUser?.updatedAt,
        };
        return res.status(200).json(responseUser);
    }
    catch (error) {
        return res.status(500).json("internal server error");
    }
};
exports.getCurrentUser = getCurrentUser;
//# sourceMappingURL=userController.js.map