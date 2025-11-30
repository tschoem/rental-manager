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

async function deleteUser() {
    console.log('=== Delete User ===\n');
    
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                properties: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        if (users.length === 0) {
            console.log('No users found.');
            return;
        }

        console.log('Users:');
        users.forEach((user, idx) => {
            const propertyCount = user.properties.length;
            console.log(`${idx + 1}. ${user.email || 'No email'} (${user.name || 'N/A'}) - ${propertyCount} properties`);
        });

        const userIndex = parseInt(await question('\nEnter user number to delete (or 0 to cancel): ')) - 1;
        
        if (userIndex < -1 || userIndex >= users.length) {
            console.error('Invalid selection');
            return;
        }

        if (userIndex === -1) {
            console.log('Cancelled.');
            return;
        }

        const user = users[userIndex];

        if (user.properties.length > 0) {
            console.log(`\n⚠️  WARNING: This user owns ${user.properties.length} property/properties:`);
            user.properties.forEach(p => console.log(`   - ${p.name}`));
            console.log('\nDeleting this user will also delete all their properties and related data!');
            
            const confirm = await question('\nType "DELETE" to confirm: ');
            if (confirm !== 'DELETE') {
                console.log('Cancelled.');
                return;
            }
        } else {
            const confirm = await question(`\nAre you sure you want to delete ${user.email}? (yes/no): `);
            if (confirm.toLowerCase() !== 'yes') {
                console.log('Cancelled.');
                return;
            }
        }

        await prisma.user.delete({
            where: { id: user.id }
        });

        console.log(`\n✓ Deleted user: ${user.email}`);
    } catch (error) {
        console.error('Error deleting user:', error);
    } finally {
        await prisma.$disconnect();
        rl.close();
    }
}

deleteUser();

