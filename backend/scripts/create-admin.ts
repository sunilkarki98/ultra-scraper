// Script to create an admin user directly
import prisma from '../src/utils/prisma';
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';

async function createAdminUser(email: string, password: string, name?: string) {
    try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            console.log('⚠️  User already exists. Updating to admin role...');
            const updated = await prisma.user.update({
                where: { email },
                data: { role: 'admin' }
            });
            console.log(`✅ User ${email} is now an admin!`);
            console.log(`User ID: ${updated.id}`);
            console.log(`Role: ${updated.role}`);

            // Create API key if doesn't exist
            const existingKeys = await prisma.apiKey.findMany({
                where: { userId: updated.id }
            });

            if (existingKeys.length === 0) {
                const apiKey = await createApiKeyForUser(updated.id);
                console.log(`\n🔑 API Key created: ${apiKey}`);
            } else {
                console.log(`\n🔑 Existing API Key: ${existingKeys[0].key}`);
            }

            return;
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create admin user
        const user = await prisma.user.create({
            data: {
                email,
                name: name || email.split('@')[0],
                passwordHash,
                role: 'admin',
                plan: 'enterprise',
                status: 'active',
            },
        });

        console.log('✅ Admin user created successfully!');
        console.log(`Email: ${user.email}`);
        console.log(`Name: ${user.name}`);
        console.log(`User ID: ${user.id}`);
        console.log(`Role: ${user.role}`);
        console.log(`Plan: ${user.plan}`);

        // Create API key
        const apiKey = await createApiKeyForUser(user.id);
        console.log(`\n🔑 API Key: ${apiKey}`);
        console.log('\n💡 Save this API key! You can use it to access admin endpoints.');
        console.log('   Add it as X-API-Key header in your requests.');

    } catch (error: any) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

async function createApiKeyForUser(userId: string): Promise<string> {
    const key = `sk_${nanoid(32)}`;

    await prisma.apiKey.create({
        data: {
            key,
            name: 'Admin Key',
            userId,
            isActive: true,
        },
    });

    return key;
}

// Get arguments from command line
const email = process.argv[2];
const password = process.argv[3];
const name = process.argv[4];

if (!email || !password) {
    console.error('Usage: ts-node scripts/create-admin.ts <email> <password> [name]');
    console.error('Example: ts-node scripts/create-admin.ts admin@example.com MySecurePass123 "Admin User"');
    process.exit(1);
}

createAdminUser(email, password, name);
