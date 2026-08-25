import prisma from "@/lib/prisma";
import bcrypt from 'bcryptjs'
import { DEFAULT_PASSWORDS, isDefaultForUser } from "@/lib/defaultPasswords";

export interface CreateAdminData {
    name: string;
    email: string;
    password?: string;
    instituteId: string;
}

export class PrismaUserRepository {
    async createAdmin(data: CreateAdminData) {
        const password = data.password ?? DEFAULT_PASSWORDS.ADMIN_NEW; // Default password for new admins
        const hashedPassword = await bcrypt.hash(password, 10);

        return await prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                password: hashedPassword,
                hasDefaultPassword: isDefaultForUser(password),
                roles: ['ADMIN'],
                instituteId: data.instituteId,
            },
        });
    }
}
