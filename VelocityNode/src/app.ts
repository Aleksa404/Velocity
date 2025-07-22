import "dotenv/config";
import express from "express";
import usersRouter from "./routes/users";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { clerkMiddleware } from "@clerk/express";
import clerkRouter from "./routes/clerkWebhooks";
import bodyParser from "body-parser";
import { requireRole } from "./middleware/authMiddleware";
import authRouter from "./routes/auth";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

const prisma = new PrismaClient();

app.use(
  "/api/clerk",
  bodyParser.raw({ type: "application/json" }),
  clerkRouter
);

// Middleware
app.use(express.json());
app.use(clerkMiddleware());

//routes
app.use("/api/users", usersRouter);

app.use("/api/auth", authRouter);

app.get("/trainer-endpoint", requireRole("TRAINER"), (req, res) => {
  res.json({ message: "Welcome, trainer!" });
});
app.get("/user-endpoint", requireRole("USER"), (req, res) => {
  res.json({ message: "Welcome, user!" });
});

app.get("/api/protected", requireRole("USER"), (req, res) => {
  const auth = (req as any).auth();
  const userId = auth.userId; // ✅ Clerk extracts it for you
  console.log("Protected route accessed by user ID:", userId);
  res.json({
    success: true,
    data: userId,
    message: "Users fetched successfully",
    error: null,
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
