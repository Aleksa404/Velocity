import "dotenv/config";
import express from "express";
import { Request, Response } from "express";
import usersRouter from "./routes/users";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { ApiResponse } from "./types/ApiResponse";
import { clerkMiddleware } from "@clerk/express";
import { requireAuth, clerkClient } from "@clerk/express";
import clerkRouter from "./routes/clerkWebhooks";
import bodyParser from "body-parser";

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

app.get("/", requireAuth(), async (req: Request, res: Response) => {
  try {
    const users = await clerkClient.users.getUserList();
    console.log(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ error: "Failed to fetch users" });
  }
  const response: ApiResponse<string> = {
    success: true,
    data: "Welcome to the Velocity API",
    message: "API is running successfully",
    error: undefined,
  };
  res.status(200).json(response);
});
app.get("/test", async (req: Request, res: Response) => {
  try {
    // const user = prisma.user.findFirst({
    //   where: {
    //     email: "test@gmail.com"
    //   }});
    // if (!user) {
    //   return res.status(404).json({ error: "User not found" });
    // }
    const users = await prisma.user.findMany();
    console.log(users);

    return res.status(200).json({
      success: true,
      data: users,
      message: "Users fetched successfully",
      error: null,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({ error: "Failed to fetch user" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
