import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { Webhook } from "svix";

const prisma = new PrismaClient();

export const handleClerkWebhook = async (req: Request, res: Response) => {
  try {
    const payloadString = req.body.toString();
    const svixHeaders = {
      "svix-id": req.headers["svix-id"] as string,
      "svix-timestamp": req.headers["svix-timestamp"] as string,
      "svix-signature": req.headers["svix-signature"] as string,
    };

    const wh = new Webhook(process.env.CLERK_WEBHOOK_SIGNING_SECRET!);
    const evt: any = wh.verify(payloadString, svixHeaders);

    switch (evt.type) {
      case "user.created": {
        const { id, first_name, email_addresses } = evt.data;

        const newUser = await prisma.user.create({
          data: {
            id,
            name: first_name,
            email: email_addresses[0].email_address,
          },
        });
        break;
      }
      case "user.deleted": {
        const { id } = evt.data;
        await prisma.user.delete({
          where: { id },
        });
        break;
      }
      case "user.updated": {
        const { id, first_name } = evt.data;

        const updatedUser = await prisma.user.update({
          where: { id },
          data: {
            name: first_name,
          },
        });
        break;
      }
      default:
        console.log(`Unhandled event type: ${evt.type}`);
        break;
    }

    res.status(200).json({ message: "Webhook processed successfully" });
  } catch (error) {
    console.error("Error :", error);
    res.status(500).json({ error: "Failed to process webhook" });
  }
};
