import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
export async function seedRootAdmin() {
    const prisma = new PrismaClient();
    const email = process.env.ROOT_ADMIN_EMAIL;
    const password = process.env.ROOT_ADMIN_PASSWORD;
    const name = process.env.ROOT_ADMIN_NAME;
    const role = "ADMIN";
    if (!email || !password || !name) {
        console.error("Missing root admin credentials");
        return;
    }
    const user = await prisma.user.findUnique({
        where: { email },
    });
    if (user) {
        console.log("Root admin already exists");
        return;
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            first_name: name,
            last_name: "",
            role,
        },
    });
    console.log("Root admin created successfully");
}
