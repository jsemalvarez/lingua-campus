import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

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

                const identifier  = credentials.identifier.trim();
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
                                role:        user.roles[0], // Compatibilidad
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
                            role:        "STUDENT",
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
                token.id          = user.id;
                token.role        = (user as any).role;
                token.roles       = (user as any).roles;
                token.instituteId = (user as any).instituteId;
                token.birthDate   = (user as any).birthDate;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id          = token.id;
                (session.user as any).role        = token.role;
                (session.user as any).roles       = token.roles;
                (session.user as any).instituteId = token.instituteId;
                (session.user as any).birthDate   = token.birthDate;
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

