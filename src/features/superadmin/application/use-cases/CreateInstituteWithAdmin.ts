import { PrismaInstituteRepository } from "../../infrastructure/prisma/PrismaInstituteRepository";
import { PrismaUserRepository } from "../../infrastructure/prisma/PrismaUserRepository";

export interface CreateFullInstituteDTO {
    instituteName: string;
    subdomain: string;
    adminName: string;
    adminEmail: string;
}

export class CreateInstituteWithAdmin {
    constructor(
        private instRepo = new PrismaInstituteRepository(),
        private userRepo = new PrismaUserRepository()
    ) { }

    async execute(dto: CreateFullInstituteDTO) {
        // 1. Create Institute
        const institute = await this.instRepo.create({
            name: dto.instituteName,
            subdomain: dto.subdomain,
        });

        // 2. Create Admin for this Institute
        const admin = await this.userRepo.createAdmin({
            name: dto.adminName,
            email: dto.adminEmail,
            instituteId: institute.id,
        });

        return { institute, admin };
    }
}
