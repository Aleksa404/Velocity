import { Router, Request, Response } from "express";
import { handleClerkWebhook } from "../controllers/clerkController";

const router = Router();

router.post("/webhook", handleClerkWebhook);

export default router;
