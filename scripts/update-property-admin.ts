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

async function updatePropertyAdmin() {
    console.log('=== Update Property Admin ===\n');
    
    // List all properties
    const properties = await prisma.property.findMany({
        include: {
            admin: {
                select: { email: true, name: true }
            }
        }
    });

    if (properties.length === 0) {
        console.log('No properties found.');
        process.exit(0);
    }

    console.log('Properties:');
    properties.forEach((prop, idx) => {
        console.log(`${idx + 1}. ${prop.name} (ID: ${prop.id})`);
        console.log(`   Current admin: ${prop.admin.email || 'N/A'} (${prop.admin.name || 'N/A'})`);
    });

    const propertyIndex = parseInt(await question('\nEnter property number to update: ')) - 1;
    if (propertyIndex < 0 || propertyIndex >= properties.length) {
        console.error('Invalid property number');
        process.exit(1);
    }

    const property = properties[propertyIndex];

    // List all users
    const users = await prisma.user.findMany({
        select: { id: true, email: true, name: true }
    });

    if (users.length === 0) {
        console.log('No users found.');
        process.exit(0);
    }

    console.log('\nAvailable users:');
    users.forEach((user, idx) => {
        console.log(`${idx + 1}. ${user.email} (${user.name || 'N/A'})`);
    });

    const userIndex = parseInt(await question('\nEnter user number to assign as admin: ')) - 1;
    if (userIndex < 0 || userIndex >= users.length) {
        console.error('Invalid user number');
        process.exit(1);
    }

    const user = users[userIndex];

    try {
        await prisma.property.update({
            where: { id: property.id },
            data: {
                adminId: user.id
            }
        });
        console.log(`\n✓ Updated property "${property.name}" admin to ${user.email}`);
    } catch (error) {
        console.error('Error updating property admin:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
        rl.close();
    }
}

updatePropertyAdmin();

