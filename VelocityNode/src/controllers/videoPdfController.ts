import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();
const UPLOADS_PDF_DIR = path.join(__dirname, "../../uploads/pdfs");

// Ensure pdfs directory exists
if (!fs.existsSync(UPLOADS_PDF_DIR)) {
    fs.mkdirSync(UPLOADS_PDF_DIR, { recursive: true });
}

export const uploadPdf = async (req: Request, res: Response) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const { id: videoId } = req.params;
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No PDF file provided" });
        }

        // Find video
        const video = await prisma.video.findUnique({
            where: { id: videoId },
            include: { workshop: true }
        });

        if (!video) {
            // Clean up temp file
            if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(404).json({ success: false, message: "Video not found" });
        }

        // Authorization check: User must be the trainer of the workshop or an ADMIN
        const isTrainer = video.workshop.trainerId === user.id;
        const isAdmin = user.role === "ADMIN";
        if (!isTrainer && !isAdmin) {
            // Clean up temp file
            if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(403).json({ success: false, message: "Forbidden" });
        }

        // Generate unique filename for the PDF
        const fileExt = path.extname(req.file.originalname);
        const filename = `${videoId}-${Date.now()}${fileExt}`;
        const targetPath = path.join(UPLOADS_PDF_DIR, filename);

        // Move the file from temp folder to permanent uploads/pdfs folder
        fs.renameSync(req.file.path, targetPath);

        // Delete old PDF if it existed
        if (video.pdfUrl) {
            const oldFilename = video.pdfUrl.split("/").pop();
            if (oldFilename) {
                const oldPath = path.join(UPLOADS_PDF_DIR, oldFilename);
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }
        }

        // Update video in database
        const updatedVideo = await prisma.video.update({
            where: { id: videoId },
            data: {
                pdfUrl: `/uploads/pdfs/${filename}`,
                pdfOriginalName: req.file.originalname
            }
        });

        return res.status(200).json({
            success: true,
            message: "PDF uploaded successfully",
            data: updatedVideo
        });

    } catch (error: any) {
        console.error("Error uploading video PDF:", error);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

export const deletePdf = async (req: Request, res: Response) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const { id: videoId } = req.params;

        // Find video
        const video = await prisma.video.findUnique({
            where: { id: videoId },
            include: { workshop: true }
        });

        if (!video) {
            return res.status(404).json({ success: false, message: "Video not found" });
        }

        // Authorization check
        const isTrainer = video.workshop.trainerId === user.id;
        const isAdmin = user.role === "ADMIN";
        if (!isTrainer && !isAdmin) {
            return res.status(403).json({ success: false, message: "Forbidden" });
        }

        // Delete PDF file if it exists
        if (video.pdfUrl) {
            const filename = video.pdfUrl.split("/").pop();
            if (filename) {
                const filePath = path.join(UPLOADS_PDF_DIR, filename);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
        }

        // Update video in database
        const updatedVideo = await prisma.video.update({
            where: { id: videoId },
            data: {
                pdfUrl: null,
                pdfOriginalName: null
            }
        });

        return res.status(200).json({
            success: true,
            message: "PDF deleted successfully",
            data: updatedVideo
        });

    } catch (error: any) {
        console.error("Error deleting video PDF:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};
