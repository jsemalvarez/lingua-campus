const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const hashedPassword = await bcrypt.hash('linguaadmin2026', 10);

    const superAdmin = await prisma.user.upsert({
        where: { email: 'superadmin@lingua.com' },
        update: {},
        create: {
            email: 'superadmin@lingua.com',
            name: 'Super Administrador',
            password: hashedPassword,
            role: 'SUPERADMIN',
        },
    });

    console.log('Super Admin created:', superAdmin.email);
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
