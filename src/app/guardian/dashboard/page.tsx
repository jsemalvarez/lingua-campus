import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { GraduationCap, Users, User, ArrowRight, Calendar, CreditCard } from "lucide-react";
import Link from "next/link";
import dayjs from "dayjs";

export default async function GuardianDashboard() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  // Verificar que sea Tutor (o Admin)
  const roles = (session.user as any).roles || [];
  if (!roles.includes("GUARDIAN") && !roles.includes("ADMIN") && !roles.includes("SUPERADMIN")) {
    notFound();
  }

  // Buscar todos los alumnos vinculados a este tutor
  const guardianLinks = await prisma.guardianStudentLink.findMany({
    where: { guardianId: (session.user as any).id },
    include: {
      student: {
        include: {
          enrollments: {
            include: { course: true },
            where: { status: "ACTIVE" }
          },
          fees: {
            where: { status: "PENDING" }
          }
        }
      }
    }
  });

  const students = guardianLinks.map(link => link.student);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Portal de Tutores</h1>
        <p className="text-muted-foreground">
          Bienvenido/a, {session.user.name}. Aquí puedes ver el progreso de tus hijos/as.
        </p>
      </header>

      {students.length === 0 ? (
        <Card className="p-12 text-center flex flex-col items-center justify-center border-dashed">
          <div className="p-4 bg-muted rounded-full mb-4">
            <Users className="text-muted-foreground" size={32} />
          </div>
          <h2 className="text-xl font-bold">Sin alumnos vinculados</h2>
          <p className="text-muted-foreground mt-2 max-w-sm">
            Aún no tienes alumnos vinculados a tu cuenta. Contacta a la administración del instituto para vincular a tus hijos/as.
          </p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {students.map((student) => (
            <Card key={student.id} className="overflow-hidden border-border/40 hover:shadow-lg transition-all duration-300 group">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-xl group-hover:bg-primary group-hover:text-white transition-colors">
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{student.name}</h3>
                      <p className="text-sm text-muted-foreground">Alumno/a regular</p>
                    </div>
                  </div>
                  <Link 
                    href={`/dashboard`} // Por ahora al dashboard general que ya filtra por DNI (necesita ajuste)
                    className="p-2 hover:bg-muted rounded-full transition-colors"
                  >
                    <ArrowRight className="text-muted-foreground" />
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/40 rounded-xl space-y-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-tight">
                      <GraduationCap size={14} /> Cursos Activos
                    </div>
                    <p className="text-lg font-bold">{student.enrollments.length}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                        {student.enrollments.map(e => (
                             <span key={e.id} className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-md font-medium">
                                 {e.course.level || e.course.name}
                             </span>
                        ))}
                    </div>
                  </div>

                  <div className="p-4 bg-muted/40 rounded-xl space-y-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-tight">
                      <CreditCard size={14} /> Cuotas Pendientes
                    </div>
                    <p className={`text-lg font-bold ${student.fees.length > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                      {student.fees.length}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Mes en curso y anteriores</p>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-border/40 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar size={14} /> Ingresó: {dayjs(student.joinDate).format("MMMM YYYY")}
                    </div>
                    <Link 
                      href={`/students/${student.id}`} // Los tutores podrán ver la ficha pero con menos opciones (seguridad pendiente)
                      className="text-xs font-bold text-primary hover:underline hover:underline-offset-4"
                    >
                      Ver legajo completo
                    </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <footer className="pt-8 border-t border-border/40 text-center">
        <p className="text-xs text-muted-foreground">
          Lingua Campus &copy; {new Date().getFullYear()} - Panel de Consulta de Tutores
        </p>
      </footer>
    </div>
  );
}
