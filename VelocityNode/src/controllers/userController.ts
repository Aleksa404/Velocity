import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

export const createUser = async (req: Request, res: Response) => {
  const { name, email } = req.body;
  try {
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
      },
    });

    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: "Failed to create user" });
  }
};

export const deleteUserbyEmail = async (req: Request, res: Response) => {
  const { email } = req.params;
  try {
    const deletedUser = await prisma.user.delete({
      where: {
        email: email,
      },
    });
    res.status(200).json(deletedUser);
  } catch (error) {
    res.status(500).json({ error: "Failed to delete user" });
  }
};

export const addTrainerRole = async (req: Request, res: Response) => {};
