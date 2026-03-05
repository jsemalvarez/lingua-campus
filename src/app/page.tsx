import * as React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

/**
 * Main application dashboard preview.
 * This page showcases the modular and reusable components from the design system.
 */
export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <header className="mb-8 sm:mb-12 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1.5 text-left">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground/90 sm:text-5xl">
              Bienvenido, <br className="sm:hidden" />
              <span className="text-primary italic">Instituto S.XXI</span>
            </h1>
            <p className="text-base sm:text-lg text-foreground/50 font-medium">
              Gestiona tus actividades diarias y haz crecer tu instituto.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Button variant="outline" size="md" className="sm:w-auto">
              Configuración
            </Button>
            <Button variant="primary" size="md" className="premium-gradient sm:w-auto">
              + Inscripción Nueva
            </Button>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">

          <Card className="hover:scale-[1.02] active:scale-100 transition-all cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground/70 flex items-center gap-2 text-sm sm:text-base">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Ingresos del Mes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl sm:text-4xl font-bold mb-1">$450.000,00</div>
              <p className="text-xs sm:text-sm text-emerald-600 font-semibold tracking-wide">+12.5% respecto al mes anterior</p>
            </CardContent>
          </Card>

          <Card variant="glass" className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground/70 text-sm sm:text-base">Estudiantes Activos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl sm:text-4xl font-bold mb-1">128</div>
              <div className="flex items-center gap-2 mt-3">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-7 w-7 sm:h-8 sm:w-8 rounded-full border-2 border-background bg-zinc-200" />
                  ))}
                </div>
                <span className="text-xs sm:text-sm text-foreground/40 font-medium">+2 este lunes</span>
              </div>
            </CardContent>
          </Card>

          <Card variant="bordered" className="flex flex-col items-center justify-center p-6 min-h-[140px] sm:min-h-[160px] group">
            <div className="mb-4 text-primary text-lg sm:text-xl font-medium group-hover:scale-110 transition-transform text-center font-bold">
              Ver Todos los Reportes
            </div>
            <Button variant="ghost" className="rounded-full text-sm">Explorar Analíticas</Button>
          </Card>
        </div>

        {/* Action Section */}
        <section className="mt-12 sm:mt-16 rounded-2xl sm:rounded-3xl premium-gradient p-8 sm:p-12 text-white shadow-2xl flex flex-col items-center text-center gap-6 sm:gap-8 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[100px] -mr-32 -mt-32 rounded-full" />

          <h2 className="text-2xl sm:text-4xl font-bold max-w-2xl leading-tight">
            Toma el Control Administrativo de tu Institución con <span className="underline decoration-white/30">Lingua Campus</span>
          </h2>
          <p className="text-base sm:text-lg text-white/80 max-w-xl">
            Automatiza pagos, controla el presentismo y mantén una comunicación fluida con tus estudiantes.
          </p>
          <div className="flex items-center justify-center w-full">
            <Button className="bg-white text-primary hover:bg-white/90 border-0 h-12 px-8 sm:px-10 text-base w-full sm:w-auto font-bold">
              Comenzar Ahora
            </Button>
          </div>
        </section>
      </main>

      <footer className="w-full py-12 border-t border-border/40 mt-12 bg-zinc-50 dark:bg-zinc-950/50">
        <div className="container mx-auto text-center text-sm text-foreground/40 font-medium tracking-wide">
          © 2026 Lingua Campus. Diseñado para Institutos de Idiomas de Vanguardia.
        </div>
      </footer>
    </div>
  );
}
