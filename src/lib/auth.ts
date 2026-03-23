import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                });

                if (user && user.password) {
                    const isPasswordCorrect = await bcrypt.compare(credentials.password, user.password);
                    if (isPasswordCorrect) {
                        return {
                            id: user.id,
                            name: user.name,
                            email: user.email,
                            role: user.role,
                            instituteId: user.instituteId,
                        };
                    }
                }

                // @ts-ignore: Prisma cache issue in Windows
                const student = await prisma.student.findFirst({
                    where: { email: credentials.email },
                });

                // @ts-ignore: Prisma cache issue in Windows
                if (student && student.password) {
                    // @ts-ignore: Prisma cache issue in Windows
                    const isStudentPasswordCorrect = await bcrypt.compare(credentials.password, student.password);
                    if (isStudentPasswordCorrect) {
                        return {
                            id: student.id,
                            name: student.name,
                            email: student.email,
                            role: "STUDENT",
                            instituteId: student.instituteId,
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
                token.role = (user as any).role;
                token.instituteId = (user as any).instituteId;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).role = token.role;
                (session.user as any).instituteId = token.instituteId;
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
