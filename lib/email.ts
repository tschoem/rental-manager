import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';

interface BookingEmailData {
    guestName: string;
    guestEmail: string;
    roomName: string;
    propertyName: string;
    propertyAddress?: string | null;
    startDate: Date;
    endDate: Date;
    message?: string | null;
    price?: number | null;
    propertyId?: string; // Optional: to fetch admin email from database
}

export async function sendBookingNotificationEmail(data: BookingEmailData) {
    // Try to get admin email from database first
    let adminEmail: string | null = null;
    
    if (data.propertyId) {
        try {
            const property = await prisma.property.findUnique({
                where: { id: data.propertyId },
                include: {
                    admin: {
                        select: { email: true, id: true }
                    }
                }
            });
            
            if (property?.admin?.email) {
                adminEmail = property.admin.email;
                console.log(`Using admin email from property: ${adminEmail} (adminId: ${property.admin.id})`);
            } else {
                console.warn(`Property ${data.propertyId} has no admin email assigned`);
            }
        } catch (error) {
            console.warn('Error fetching admin email from database:', error);
        }
    }
    
    // Fall back to environment variable if not found in database
    if (!adminEmail) {
        adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_FROM_EMAIL || null;
    }
    
    if (!adminEmail) {
        console.warn('No admin email found in database or environment variables. Email notification skipped.');
        return;
    }

    // Configure transporter
    // For production, you'll need to set up SMTP credentials
    // For development, you can use a service like Mailtrap or Gmail
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
        },
    });

    // Calculate nights
    const nights = Math.ceil(
        (data.endDate.getTime() - data.startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const total = data.price ? nights * data.price : null;

    // Format dates
    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-IE', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #2c5f7d; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
                .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
                .info-row { margin: 10px 0; }
                .label { font-weight: bold; color: #2c5f7d; }
                .message-box { background: white; padding: 15px; border-left: 4px solid #2c5f7d; margin: 15px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>New Booking Request</h1>
                </div>
                <div class="content">
                    <h2>Guest Information</h2>
                    <div class="info-row">
                        <span class="label">Name:</span> ${data.guestName}
                    </div>
                    <div class="info-row">
                        <span class="label">Email:</span> <a href="mailto:${data.guestEmail}">${data.guestEmail}</a>
                    </div>

                    <h2 style="margin-top: 30px;">Booking Details</h2>
                    <div class="info-row">
                        <span class="label">Property:</span> ${data.propertyName}
                    </div>
                    ${data.propertyAddress ? `
                    <div class="info-row">
                        <span class="label">Address:</span> ${data.propertyAddress}
                    </div>
                    ` : ''}
                    <div class="info-row">
                        <span class="label">Room:</span> ${data.roomName}
                    </div>
                    <div class="info-row">
                        <span class="label">Check-in:</span> ${formatDate(data.startDate)}
                    </div>
                    <div class="info-row">
                        <span class="label">Check-out:</span> ${formatDate(data.endDate)}
                    </div>
                    <div class="info-row">
                        <span class="label">Nights:</span> ${nights}
                    </div>
                    ${total ? `
                    <div class="info-row">
                        <span class="label">Total:</span> €${total.toFixed(2)}
                    </div>
                    ` : ''}

                    ${data.message ? `
                    <h2 style="margin-top: 30px;">Guest Message</h2>
                    <div class="message-box">
                        ${data.message.replace(/\n/g, '<br>')}
                    </div>
                    ` : ''}

                    <p style="margin-top: 30px; color: #666; font-size: 0.9em;">
                        This is a booking request. Please log in to the admin panel to confirm or manage this booking.
                    </p>
                </div>
            </div>
        </body>
        </html>
    `;

    const emailText = `
New Booking Request

Guest Information:
- Name: ${data.guestName}
- Email: ${data.guestEmail}

Booking Details:
- Property: ${data.propertyName}
${data.propertyAddress ? `- Address: ${data.propertyAddress}\n` : ''}
- Room: ${data.roomName}
- Check-in: ${formatDate(data.startDate)}
- Check-out: ${formatDate(data.endDate)}
- Nights: ${nights}
${total ? `- Total: €${total.toFixed(2)}\n` : ''}

${data.message ? `Guest Message:\n${data.message}\n\n` : ''}

This is a booking request. Please log in to the admin panel to confirm or manage this booking.
    `;

    try {
        await transporter.sendMail({
            from: `"${data.guestName}" <${data.guestEmail}>`,
            replyTo: data.guestEmail,
            to: adminEmail,
            subject: `New Booking Request: ${data.roomName} - ${data.guestName}`,
            text: emailText,
            html: emailHtml,
        });
        console.log(`Booking notification email sent to ${adminEmail} from ${data.guestEmail}`);
    } catch (error) {
        console.error('Error sending booking notification email:', error);
        // Don't throw - we don't want email failures to break the booking submission
    }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string, resetUrl: string) {
    // Check if email is configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
        console.warn('SMTP not configured. Password reset email not sent.');
        console.log(`Password reset link for ${email}: ${resetUrl}`);
        return false;
    }

    // Configure transporter
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
        },
    });

    const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h1 style="color: #667eea; margin-bottom: 20px;">Reset Your Password</h1>
                
                <p>You requested to reset your password. Click the button below to create a new password:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">
                        Reset Password
                    </a>
                </div>
                
                <p style="color: #666; font-size: 0.9em; margin-top: 30px;">
                    Or copy and paste this link into your browser:<br>
                    <a href="${resetUrl}" style="color: #667eea; word-break: break-all;">${resetUrl}</a>
                </p>
                
                <p style="color: #999; font-size: 0.85em; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
                    This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
                </p>
            </div>
        </body>
        </html>
    `;

    const emailText = `
Reset Your Password

You requested to reset your password. Click the link below to create a new password:

${resetUrl}

This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
    `;

    try {
        await transporter.sendMail({
            from: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER,
            to: email,
            subject: 'Reset Your Password',
            text: emailText,
            html: emailHtml,
        });
        console.log(`Password reset email sent to ${email}`);
        return true;
    } catch (error) {
        console.error('Error sending password reset email:', error);
        return false;
    }
}

