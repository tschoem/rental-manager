import { PrismaClient } from '../generated/client/client';
import bcrypt from 'bcryptjs';
import * as readline from 'readline';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env file
config({ path: resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query: string): Promise<string> {
    return new Promise(resolve => rl.question(query, resolve));
}

async function setupAdmin() {
    console.log('=== Admin User Setup ===\n');
    
    const email = await question('Enter admin email: ');
    if (!email) {
        console.error('Email is required');
        process.exit(1);
    }

    const password = await question('Enter admin password: ');
    if (!password || password.length < 6) {
        console.error('Password must be at least 6 characters');
        process.exit(1);
    }

    const name = await question('Enter admin name (optional): ') || 'Admin User';

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            // Update existing user
            await prisma.user.update({
                where: { email },
                data: {
                    name,
                    password: hashedPassword
                }
            });
            console.log(`\n✓ Updated admin user: ${email}`);
        } else {
            // Create new user
            await prisma.user.create({
                data: {
                    email,
                    name,
                    password: hashedPassword
                }
            });
            console.log(`\n✓ Created admin user: ${email}`);
        }
    } catch (error) {
        console.error('Error setting up admin user:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
        rl.close();
    }
}

setupAdmin();

