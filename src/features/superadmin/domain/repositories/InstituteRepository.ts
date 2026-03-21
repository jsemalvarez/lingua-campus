export interface CreateInstituteData {
    name: string;
    subdomain: string;
    plan?: string;
    customDomain?: string | null;
    pwaIcon192?: string | null;
    pwaIcon512?: string | null;
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
