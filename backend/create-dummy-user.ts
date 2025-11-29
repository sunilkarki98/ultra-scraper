import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = 'dummy@example.com';

    console.log(`Creating dummy user: ${email}`);

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        user = await prisma.user.create({
            data: {
                email,
                name: 'Dummy User',
                role: 'user',
                plan: 'free',
                status: 'active',
            },
        });
        console.log('Dummy user created.');
    } else {
        // Reset state
        await prisma.user.update({
            where: { id: user.id },
            data: {
                plan: 'free',
                status: 'active'
            }
        });
        console.log('Dummy user reset to initial state.');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
