'use server';

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function createAdminUser(formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string || "Admin User";

    // Validation
    if (!email || !email.includes('@')) {
        return { error: "Valid email is required" };
    }

    if (!password || password.length < 6) {
        return { error: "Password must be at least 6 characters" };
    }

    try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            // Update existing user
            const hashedPassword = await bcrypt.hash(password, 10);
            await prisma.user.update({
                where: { email },
                data: {
                    name,
                    password: hashedPassword
                }
            });
            return { success: true, message: `Admin user updated: ${email}` };
        } else {
            // Create new user
            const hashedPassword = await bcrypt.hash(password, 10);
            await prisma.user.create({
                data: {
                    email,
                    name,
                    password: hashedPassword
                }
            });
            return { success: true, message: `Admin user created: ${email}` };
        }
    } catch (error: any) {
        console.error('Error creating admin user:', error);
        return { error: error.message || "Failed to create admin user" };
    }
}

export async function checkIfUsersExist(): Promise<boolean> {
    try {
        const userCount = await prisma.user.count();
        return userCount > 0;
    } catch (error) {
        // If database isn't configured, return false
        return false;
    }
}

