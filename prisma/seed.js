const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const adminEmail = process.env.SEED_SUPERADMIN_EMAIL;
    const adminPassword = process.env.SEED_SUPERADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
        console.error('Por favor, define SEED_SUPERADMIN_EMAIL y SEED_SUPERADMIN_PASSWORD en tu archivo .env');
        process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const superAdmin = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
            email: adminEmail,
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
