import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";

export function requireRole(requiredRole: "ADMIN" | "TRAINER" | "USER") {
  return async (req: any, res: Response, next: NextFunction) => {
    try {
      const auth = req.auth();
      const userId = auth?.userId as any;

      if (!userId) {
        return res
          .status(401)
          .json({ message: "Unauthorized: Missing userId" });
      }
      const prisma = new PrismaClient();
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.role !== requiredRole) {
        return res.status(403).json({ message: "Access denied" });
      }

      next();
    } catch (error) {
      console.error("Error in requireRole middleware:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}
