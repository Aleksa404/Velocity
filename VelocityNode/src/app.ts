import "dotenv/config";
import express from "express";
import usersRouter from "./routes/users";
import cors from "cors";
import { authenticateToken } from "./middleware/authMiddleware";
import authRouter from "./routes/auth";
import cookieParser from "cookie-parser";
import videoRouter from "./routes/videos";
import trainerRequestRouter from "./routes/trainerRequests";
import trainerRouter from "./routes/trainers";
import workshopRouter from "./routes/workshops";

const app = express();
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cookieParser());

//routes


app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/videos", videoRouter);
app.use("/api/trainer-requests", trainerRequestRouter);
app.use("/api/trainers", trainerRouter);
app.use("/api/workshops", workshopRouter);

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
