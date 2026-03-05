import prisma from "@/lib/prisma";
import { CreateInstituteData, IInstituteRepository, InstituteEntity } from "../../domain/repositories/InstituteRepository";

export class PrismaInstituteRepository implements IInstituteRepository {
    async create(data: CreateInstituteData): Promise<InstituteEntity> {
        return await prisma.institute.create({
            data: {
                name: data.name,
                subdomain: data.subdomain,
                address: data.address,
                phone: data.phone,
            },
        }) as unknown as InstituteEntity;
    }

    async findAll(): Promise<InstituteEntity[]> {
        return await prisma.institute.findMany({
            orderBy: { createdAt: 'desc' },
        }) as unknown as InstituteEntity[];
    }
}
