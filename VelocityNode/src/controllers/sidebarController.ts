import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { ApiResponse } from "../types/ApiResponse";

const prisma = new PrismaClient();

// Get full sidebar structure
export const getSidebar = async (req: Request, res: Response<ApiResponse<any>>) => {
    try {
        const sections = await prisma.sidebarSection.findMany({
            include: {
                items: {
                    orderBy: { order: "asc" },
                },
            },
            orderBy: { order: "asc" },
        });

        res.json({
            success: true,
            data: sections,
            message: "Sidebar fetched successfully",
        });
    } catch (error: any) {
        console.error("Error fetching sidebar:", error);
        res.status(500).json({
            success: false,
            data: null,
            message: error.message || "Failed to fetch sidebar",
        });
    }
};

// Create or Update Section
export const upsertSection = async (req: Request, res: Response<ApiResponse<any>>) => {
    try {
        const { id, title, order, icon, path, roles } = req.body;

        let section;
        if (id) {
            section = await prisma.sidebarSection.update({
                where: { id },
                data: { title, order, icon, path, roles },
            });
        } else {
            // Get the highest order to append to the end
            const lastSection = await prisma.sidebarSection.findFirst({
                orderBy: { order: 'desc' },
                select: { order: true }
            });
            const nextOrder = lastSection ? lastSection.order + 1 : 0;

            section = await prisma.sidebarSection.create({
                data: { title, order: nextOrder, icon, path, roles: roles || [] },
            });
        }

        res.json({
            success: true,
            data: section,
            message: id ? "Section updated" : "Section created",
        });
    } catch (error: any) {
        console.error("Error upserting section:", error);
        res.status(500).json({
            success: false,
            data: null,
            message: "Failed to save section",
        });
    }
};

// Delete Section
export const deleteSection = async (req: Request, res: Response<ApiResponse<null>>) => {
    try {
        const { id } = req.params;
        await prisma.sidebarSection.delete({ where: { id } });

        res.json({
            success: true,
            data: null,
            message: "Section deleted",
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            data: null,
            message: "Failed to delete section",
        });
    }
};

// Create or Update Item
export const upsertItem = async (req: Request, res: Response<ApiResponse<any>>) => {
    try {
        const { id, label, icon, path, order, roles, sectionId } = req.body;

        let item;
        if (id) {
            item = await prisma.sidebarItem.update({
                where: { id },
                data: { label, icon, path, order, roles, sectionId },
            });
        } else {
            // Get highest order in the specific section
            const lastItem = await prisma.sidebarItem.findFirst({
                where: { sectionId },
                orderBy: { order: 'desc' },
                select: { order: true }
            });
            const nextOrder = lastItem ? lastItem.order + 1 : 0;

            item = await prisma.sidebarItem.create({
                data: { label, icon, path, order: nextOrder, roles: roles || [], sectionId },
            });
        }

        res.json({
            success: true,
            data: item,
            message: id ? "Item updated" : "Item created",
        });
    } catch (error: any) {
        console.error("Error upserting item:", error);
        res.status(500).json({
            success: false,
            data: null,
            message: "Failed to save item",
        });
    }
};

// Delete Item
export const deleteItem = async (req: Request, res: Response<ApiResponse<null>>) => {
    try {
        const { id } = req.params;
        await prisma.sidebarItem.delete({ where: { id } });

        res.json({
            success: true,
            data: null,
            message: "Item deleted",
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            data: null,
            message: "Failed to delete item",
        });
    }
};

// Reorder Sections
export const reorderSections = async (req: Request, res: Response<ApiResponse<null>>) => {
    try {
        const { sections } = req.body; // Expects array of { id, order }

        await prisma.$transaction(
            sections.map((s: any) =>
                prisma.sidebarSection.update({
                    where: { id: s.id },
                    data: { order: s.order },
                })
            )
        );

        res.json({
            success: true,
            data: null,
            message: "Sections reordered",
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            data: null,
            message: "Failed to reorder sections",
        });
    }
};
