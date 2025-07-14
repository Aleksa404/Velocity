import { Router } from "express";
import {
  createUser,
  deleteUserbyEmail,
  getAllUsers,
} from "../controllers/userController";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

router.get("/", getAllUsers);

router.get("/:id", (req, res) => {
  console.log(req.params.id);
});

router.post("/createUser", createUser);

router.delete("/deleteUser/:email", deleteUserbyEmail);

export default router;
