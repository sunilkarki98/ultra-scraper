import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@nxscrape.com';
    const rawKey = 'sk_admin_' + crypto.randomBytes(16).toString('hex');
    const hashedKey = crypto.createHash('sha256').update(rawKey).digest('hex');

    console.log(`Creating admin user: ${email}`);

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        user = await prisma.user.create({
            data: {
                email,
                name: 'Admin User',
                role: 'admin',
                plan: 'pro',
                status: 'active',
            },
        });
        console.log('Admin user created.');
    } else {
        // Ensure role is admin
        user = await prisma.user.update({
            where: { id: user.id },
            data: { role: 'admin' }
        });
        console.log('Existing user updated to admin role.');
    }

    // Create API Key
    await prisma.apiKey.create({
        data: {
            key: hashedKey,
            name: 'Admin Key',
            userId: user.id,
            isActive: true,
        }
    });

    console.log('\n==================================================');
    console.log('ADMIN API KEY GENERATED:');
    console.log(rawKey);
    console.log('==================================================\n');
    console.log('Use this key to log in to the Admin Panel.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
