import "dotenv/config";
import express from "express";
import usersRouter from "./routes/users";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { authenticateToken, requireRole } from "./middleware/authMiddleware";
import authRouter from "./routes/auth";
import cookieParser from "cookie-parser";

const app = express();
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

const PORT = process.env.PORT || 5000;

const prisma = new PrismaClient();

// Middleware
app.use(express.json());
app.use(cookieParser());

//routes

app.use("/api/auth", authRouter);
app.use("/api/users", authenticateToken, usersRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
