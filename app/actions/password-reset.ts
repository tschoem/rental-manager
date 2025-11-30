'use server';

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/lib/email";

/**
 * Request a password reset - generates a token and sends email
 */
export async function requestPasswordReset(email: string) {
    if (!email || !email.includes('@')) {
        return { error: "Please provide a valid email address" };
    }

    try {
        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email }
        });

        // Don't reveal if user exists or not (security best practice)
        if (!user) {
            // Return success even if user doesn't exist to prevent email enumeration
            return { success: true, message: "If an account with that email exists, a password reset link has been sent." };
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpires = new Date();
        resetTokenExpires.setHours(resetTokenExpires.getHours() + 1); // Token expires in 1 hour

        // Save reset token to user
        await prisma.user.update({
            where: { email },
            data: {
                resetToken,
                resetTokenExpires
            }
        });

        // Generate reset URL
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}`;

        // Try to send email
        const emailSent = await sendPasswordResetEmail(email, resetUrl);

        // In development, if email isn't configured, return the link
        if (!emailSent && process.env.NODE_ENV === 'development') {
            console.log(`Password reset link for ${email}: ${resetUrl}`);
            return { 
                success: true, 
                message: "Password reset link generated. Check the server console for the link (email not configured).",
                resetUrl: resetUrl
            };
        }

        // Return generic message (don't reveal if user exists)
        return { 
            success: true, 
            message: "If an account with that email exists, a password reset link has been sent to your email." 
        };
    } catch (error: any) {
        console.error('Error requesting password reset:', error);
        return { error: "An error occurred. Please try again later." };
    }
}

/**
 * Reset password using a token
 */
export async function resetPassword(token: string, newPassword: string) {
    if (!token || !newPassword) {
        return { error: "Token and password are required" };
    }

    if (newPassword.length < 6) {
        return { error: "Password must be at least 6 characters long" };
    }

    try {
        // Find user with valid reset token
        const user = await prisma.user.findFirst({
            where: {
                resetToken: token,
                resetTokenExpires: {
                    gt: new Date() // Token must not be expired
                }
            }
        });

        if (!user) {
            return { error: "Invalid or expired reset token. Please request a new password reset." };
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password and clear reset token
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpires: null
            }
        });

        return { success: true, message: "Password has been reset successfully. You can now sign in with your new password." };
    } catch (error: any) {
        console.error('Error resetting password:', error);
        return { error: "An error occurred. Please try again later." };
    }
}

/**
 * Verify if a reset token is valid
 */
export async function verifyResetToken(token: string) {
    if (!token) {
        return { valid: false };
    }

    try {
        const user = await prisma.user.findFirst({
            where: {
                resetToken: token,
                resetTokenExpires: {
                    gt: new Date()
                }
            },
            select: {
                id: true,
                email: true
            }
        });

        return { valid: !!user, email: user?.email };
    } catch (error) {
        return { valid: false };
    }
}

