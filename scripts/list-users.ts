import { PrismaClient } from '../generated/client/client';
import * as readline from 'readline';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query: string): Promise<string> {
    return new Promise(resolve => rl.question(query, resolve));
}

async function listUsers() {
    console.log('=== List All Users ===\n');
    
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                password: true, // Check if password is set
                properties: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        if (users.length === 0) {
            console.log('No users found in database.');
            return;
        }

        console.log(`Found ${users.length} user(s):\n`);
        users.forEach((user, idx) => {
            const hasPassword = user.password ? '✓ Has password' : '✗ No password (cannot login)';
            const propertyCount = user.properties.length;
            
            console.log(`${idx + 1}. ${user.email || 'No email'}`);
            console.log(`   Name: ${user.name || 'N/A'}`);
            console.log(`   ID: ${user.id}`);
            console.log(`   Password: ${hasPassword}`);
            console.log(`   Properties: ${propertyCount} (${user.properties.map(p => p.name).join(', ') || 'None'})`);
            console.log('');
        });

        // Check specifically for admin@example.com
        const adminExample = users.find(u => u.email === 'admin@example.com');
        if (adminExample) {
            console.log('⚠️  WARNING: admin@example.com user exists!');
            if (adminExample.password) {
                console.log('   This user CAN login if someone knows the password.');
            } else {
                console.log('   This user CANNOT login (no password set).');
            }
        }
    } catch (error) {
        console.error('Error listing users:', error);
    } finally {
        await prisma.$disconnect();
        rl.close();
    }
}

listUsers();

