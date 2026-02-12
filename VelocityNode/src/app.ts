import "dotenv/config";
import express from "express";
import path from "path";
import usersRouter from "./routes/users";
import cors from "cors";
import authRouter from "./routes/auth";
import cookieParser from "cookie-parser";
import videoRouter from "./routes/videos";
import trainerRequestRouter from "./routes/trainerRequests";
import trainerRouter from "./routes/trainers";
import workshopRouter from "./routes/workshops";
import sidebarRouter from "./routes/sidebar";
import "./YoutubeUploadMQ/videoWorker";
import { seedRootAdmin } from "./utils/seedRootAdmin";

async function main() {


  const app = express();

  const allowedOrigins = process.env.CORS_ORIGIN?.split(',').map(origin => origin.trim()) || [];
  console.log("Allowed Origins for CORS:", allowedOrigins);

  app.use(cors({
    origin: allowedOrigins,
    credentials: true
  })
  );


  const PORT = process.env.PORT || 5000;

  await seedRootAdmin();
  // Middleware
  app.use(express.json());
  app.use(cookieParser());

  // Request Logger for debugging
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  // Static file serving for uploads
  app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

  //routes
  app.get("/api/health", (_req, res) => {
    res.status(200).json({ status: "ok", uptime: process.uptime() });
  });
  app.use("/api/auth", authRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/videos", videoRouter);
  app.use("/api/trainer-requests", trainerRequestRouter);
  app.use("/api/trainers", trainerRouter);
  app.use("/api/workshops", workshopRouter);
  app.use("/api/sidebar", sidebarRouter);


  const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}
main().catch((error) => {
  console.error("Error starting server:", error);
  process.exit(1);
});