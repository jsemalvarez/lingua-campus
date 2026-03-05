export interface CreateInstituteData {
    name: string;
    subdomain: string;
    address?: string;
    phone?: string;
}

export interface InstituteEntity extends CreateInstituteData {
    id: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IInstituteRepository {
    create(data: CreateInstituteData): Promise<InstituteEntity>;
    findAll(): Promise<InstituteEntity[]>;
}
