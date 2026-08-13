import prisma from "@/lib/prisma";
import bcrypt from 'bcryptjs'

export interface CreateAdminData {
    name: string;
    email: string;
    password?: string;
    instituteId: string;
}

export class PrismaUserRepository {
    async createAdmin(data: CreateAdminData) {
        const password = data.password ?? 'admin123'; // Default password for new admins
        const hashedPassword = await bcrypt.hash(password, 10);

        return await prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                password: hashedPassword,
                roles: ['ADMIN'],
                instituteId: data.instituteId,
            },
        });
    }
}
