import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@example.com';
    const rawApiKey = 'admin-secret-key-' + Date.now();
    const hash = crypto.createHash('sha256').update(rawApiKey).digest('hex');

    console.log(`Creating admin user: ${email}`);
    console.log(`API Key: ${rawApiKey}`);

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        user = await prisma.user.create({
            data: {
                email,
                name: 'Admin User',
                role: 'admin',
            },
        });
        console.log('User created.');
    } else {
        await prisma.user.update({
            where: { id: user.id },
            data: { role: 'admin' }
        });
        console.log('User updated to admin.');
    }

    await prisma.apiKey.create({
        data: {
            key: hash,
            userId: user.id,
            name: 'Admin Key ' + Date.now(),
        },
    });

    console.log('API key created successfully.');
    console.log('----------------------------------------');
    console.log(`Use this API Key: ${rawApiKey}`);
    console.log('----------------------------------------');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
