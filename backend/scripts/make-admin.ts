// Script to make a user admin
import prisma from '../src/utils/prisma';

async function makeAdmin(email: string) {
    try {
        const user = await prisma.user.update({
            where: { email },
            data: { role: 'admin' }
        });

        console.log(`✅ User ${email} is now an admin!`);
        console.log(`User ID: ${user.id}`);
        console.log(`Role: ${user.role}`);
    } catch (error: any) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
    console.error('Usage: ts-node scripts/make-admin.ts <email>');
    process.exit(1);
}

makeAdmin(email);
