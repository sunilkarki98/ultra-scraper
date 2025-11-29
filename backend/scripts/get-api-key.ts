// Script to get or create API key for a user
import prisma from '../src/utils/prisma';
import { nanoid } from 'nanoid';

async function getOrCreateApiKey(email: string) {
    try {
        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
            include: { apiKeys: true }
        });

        if (!user) {
            console.error(`❌ User with email ${email} not found.`);
            console.log('\n💡 Create a user first with:');
            console.log(`   npx ts-node scripts/create-admin.ts ${email} YourPassword123`);
            return;
        }

        console.log(`\n👤 User Found:`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Name: ${user.name}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Plan: ${user.plan}`);
        console.log(`   Status: ${user.status}`);

        // Check existing API keys
        const activeKeys = user.apiKeys.filter(k => k.isActive);

        if (activeKeys.length > 0) {
            console.log(`\n🔑 Existing API Keys:`);
            activeKeys.forEach((key, index) => {
                console.log(`   ${index + 1}. ${key.name}: ${key.key}`);
                console.log(`      Created: ${key.createdAt.toLocaleString()}`);
                if (key.lastUsedAt) {
                    console.log(`      Last Used: ${key.lastUsedAt.toLocaleString()}`);
                }
            });
        } else {
            console.log(`\n⚠️  No active API keys found. Creating one...`);

            const newKey = `sk_${nanoid(32)}`;
            await prisma.apiKey.create({
                data: {
                    key: newKey,
                    name: 'Admin Key',
                    userId: user.id,
                    isActive: true,
                },
            });

            console.log(`\n🔑 New API Key Created: ${newKey}`);
        }

        console.log(`\n💡 Use this API key in the admin dashboard at http://localhost:3001/admin`);

    } catch (error: any) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

// Get email from command line
const email = process.argv[2];

if (!email) {
    console.error('Usage: ts-node scripts/get-api-key.ts <email>');
    console.error('Example: ts-node scripts/get-api-key.ts admin@example.com');
    process.exit(1);
}

getOrCreateApiKey(email);
