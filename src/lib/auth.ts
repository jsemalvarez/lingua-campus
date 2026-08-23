import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { recordActivity } from "@/lib/activity";

/**
 * Cada cuánto se releen los roles de la base hacia el JWT. Acota cuánto puede
 * tardar en verse un cambio de roles sin pagar una query por request.
 */
const ROLES_REFRESH_MS = 5 * 60 * 1000;

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                identifier:  { label: "Email o DNI", type: "text" },
                password:    { label: "Password",    type: "password" },
                instituteId: { label: "Institute ID", type: "text" },
            },
            async authorize(credentials) {
                if (!credentials?.identifier || !credentials?.password) return null;

                const identifier  = credentials.identifier.trim().toLowerCase();
                const instituteId = credentials.instituteId?.trim() || undefined;
                const isEmail     = identifier.includes("@");

                // ── 1. Buscar en la tabla User (staff: ADMIN, TEACHER, SECRETARY, GUARDIAN) ──
                if (isEmail) {
                    const user = await prisma.user.findUnique({
                        where: { email: identifier },
                        select: { id: true, name: true, email: true, password: true, roles: true, instituteId: true }
                    });

                    if (user?.password) {
                        const ok = await bcrypt.compare(credentials.password, user.password);
                        if (ok) {
                            return {
                                id:          user.id,
                                name:        user.name,
                                email:       user.email,
                                roles:       user.roles,
                                instituteId: user.instituteId,
                            };
                        }
                    }
                }

                // ── 2. Buscar en la tabla Student ─────────────────────────────────────
                const student = await prisma.student.findFirst({
                    where: isEmail
                        ? { email: identifier }                          // buscar por email
                        : { dni: identifier, instituteId: instituteId }, // buscar por DNI + instituto
                });

                if (student?.password) {
                    const ok = await bcrypt.compare(credentials.password, student.password);
                    if (ok) {
                        return {
                            id:          student.id,
                            name:        student.name,
                            email:       student.email,
                            roles:       ["STUDENT"],
                            instituteId: student.instituteId,
                            birthDate:   student.birthDate,
                        };
                    }
                }

                return null;
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id            = user.id;
                token.roles         = user.roles;
                token.instituteId   = user.instituteId;
                token.birthDate     = user.birthDate;
                token.rolesSyncedAt = Date.now();

                // El único momento en que se sabe que alguien tipeó su
                // contraseña, y vale para las dos tablas (FEAT-11). Antes de
                // esto el sistema no guardaba ninguna fecha de ingreso.
                await recordActivity({
                    subjectType: user.roles?.includes("STUDENT") ? "STUDENT" : "USER",
                    subjectId:   user.id,
                    instituteId: user.instituteId,
                    roles:       user.roles ?? [],
                    isLogin:     true,
                });

                return token;
            }

            if (!token.id) return token;

            // El token dura 30 días. Sin esto, a quien le agregan un rol lo
            // conserva viejo hasta cerrar sesión: la cookie de rol activo se
            // descarta por "inválida" y el selector de rol ni aparece (BUG-04).
            //
            // La autorización no depende de esto — `getAuthContext` lee los roles
            // de la base en cada acción —, pero la interfaz sí, y es lo que ve
            // el usuario.
            //
            // Esta misma compuerta es la que marca actividad para el panel de
            // uso (FEAT-11): ya corría con la frecuencia justa, así que medir
            // uso cuesta una sentencia cada cinco minutos por persona activa, y
            // no hace falta ni middleware ni instrumentar pantallas. Los alumnos
            // pasan por acá aunque su rol no cambie nunca — el corte por
            // STUDENT bajó a la relectura de roles, que es lo único que no les
            // corresponde.
            const syncedAt = token.rolesSyncedAt ?? 0;
            if (Date.now() - syncedAt < ROLES_REFRESH_MS) return token;

            // Se marca antes de decidir qué hacer: pase lo que pase, no se
            // vuelve a consultar hasta que expire el intervalo.
            token.rolesSyncedAt = Date.now();

            const isStudent = token.roles?.includes("STUDENT") ?? false;

            if (!isStudent) {
                const fresh = await prisma.user.findUnique({
                    where: { id: token.id },
                    select: { roles: true, instituteId: true, status: true },
                });

                // El token guarda el `id` pero no de qué tabla salió, y los
                // alumnos viven en `Student`. A ésos los ataja el `isStudent`,
                // así que acá sólo puede caer una fila de `User` borrada
                // físicamente — la app sólo da de baja lógica, o sea que eso
                // implica haber tocado la base a mano.
                //
                // Aun así no se blanquea: los roles del token sólo alimentan la
                // interfaz, y dejarla sin nada con qué decidir muestra una app
                // vacía en lugar de un error. Quien deniega es `getAuthContext`,
                // que consulta la base en cada acción.
                if (fresh) {
                    // Cuenta dada de baja: se vacían los roles. Sin roles no pasa
                    // ningún chequeo, y la interfaz deja de ofrecer lo que ya no
                    // puede hacer.
                    token.roles       = fresh.status === "ACTIVE" ? fresh.roles : [];
                    token.instituteId = fresh.instituteId;
                }
            }

            await recordActivity({
                subjectType: isStudent ? "STUDENT" : "USER",
                subjectId:   token.id,
                instituteId: token.instituteId ?? null,
                roles:       token.roles ?? [],
            });

            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id          = token.id;
                session.user.roles       = token.roles;
                session.user.instituteId = token.instituteId;
                session.user.birthDate   = token.birthDate;
            }
            return session;
        },

    },
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
    },
};

