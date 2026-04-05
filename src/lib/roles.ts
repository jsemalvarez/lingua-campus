import { cookies } from "next/headers";
import { UserRole } from "@prisma/client";

const ROLE_PRIORITY: UserRole[] = ["SUPERADMIN", "ADMIN", "SECRETARY", "TEACHER", "GUARDIAN"];

export async function getActiveRole(userRoles: string[]): Promise<string> {
    const cookieStore = await cookies();
    const currentRole = cookieStore.get("lingua_current_role")?.value;

    // Si hay una cookie válida, usarla
    if (currentRole && userRoles.includes(currentRole)) {
        return currentRole;
    }

    // Si no hay cookie o es inválida, buscar el rol de mayor jerarquía
    for (const role of ROLE_PRIORITY) {
        if (userRoles.includes(role)) {
            return role;
        }
    }

    // Por defecto el primero de la lista
    return userRoles[0];
}
