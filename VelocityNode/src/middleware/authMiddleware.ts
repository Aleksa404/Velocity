/// <reference path="../types/globals.d.ts" />
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { UserPayloadType } from "../types/globals";

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.sendStatus(401);
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    if (typeof decoded === "string") {
      return res.status(401).json({ message: "Invalid token payload" });
    }
    req.user = decoded as UserPayloadType;

    next();
  } catch (error: any) {
    return res.status(401).json({
      message: "Invalid or expired token",
      error: error.message
    });
  }
};


export function requireRole(requiredRole: "ADMIN" | "TRAINER" | "USER") {
  return async (req: any, res: Response, next: NextFunction) => {
    try {
      const { id, role } = req.user;

      if (!id) {
        return res
          .status(401)
          .json({ message: "Unauthorized: Missing userId" });
      }
      const prisma = new PrismaClient();
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
    } catch (error) {
      console.error("Error in requireRole middleware:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}
