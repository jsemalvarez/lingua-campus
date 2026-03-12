"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import {
  Users,
  BookOpen,
  DollarSign,
  Gamepad2,
  ArrowRight,
  GraduationCap,
  Sparkles,
  BarChart3,
  Menu,
  X,
  LogIn
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <div className="relative min-h-screen bg-white dark:bg-slate-950 font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      {/* Decorative background gradients */}
      <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-indigo-50/50 to-transparent dark:from-indigo-950/20 pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-violet-400/10 dark:bg-violet-600/10 blur-3xl pointer-events-none" />
      <div className="absolute top-40 -left-40 w-[500px] h-[500px] rounded-full bg-indigo-400/10 dark:bg-indigo-600/10 blur-3xl pointer-events-none" />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center transform group-hover:scale-105 transition-all shadow-lg shadow-indigo-500/20">
              <GraduationCap className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300">
              Lingua Campus
            </span>
          </div>

          {/* Desktop buttons */}
          <div className="hidden sm:flex items-center gap-4">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" className="font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors">
                Acceder
              </Button>
            </Link>
            <Link href="#contacto">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25 rounded-full px-6 transition-all hover:scale-105 hover:-translate-y-0.5">
                Prueba Gratuita
              </Button>
            </Link>
          </div>

          {/* Mobile: theme toggle + login icon + hamburger */}
          <div className="flex sm:hidden items-center gap-1">
            <ThemeToggle />
            <Link
              href="/login"
              className="p-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Iniciar sesión"
              title="Iniciar sesión"
            >
              <LogIn size={20} />
            </Link>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              aria-label={isMobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        <div
          className={`sm:hidden overflow-hidden transition-all duration-300 ease-in-out bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-t border-slate-200/50 dark:border-slate-800/50 ${isMobileMenuOpen ? "max-h-32 opacity-100" : "max-h-0 opacity-0"
            }`}
        >
          <div className="container mx-auto px-4 py-4 flex flex-col gap-3">
            <Link href="#contacto" onClick={() => setIsMobileMenuOpen(false)}>
              <Button className="w-full justify-center bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25 rounded-full transition-all">
                Prueba Gratuita
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative pt-32 pb-16 sm:pt-40 sm:pb-24">
        {/* Hero Section */}
        <section className="container mx-auto px-6 text-center max-w-5xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium text-sm mb-8 border border-indigo-100 dark:border-indigo-500/20 shadow-sm animate-fade-in-up">
            <Sparkles className="w-4 h-4" />
            <span>La evolución en la gestión de institutos de idiomas</span>
          </div>

          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1] mb-6 animate-fade-in-up animation-delay-100">
            Administra. Analiza. <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
              Potencia el aprendizaje.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10 animate-fade-in-up animation-delay-200 leading-relaxed">
            Una plataforma integral diseñada especialmente para centros educativos. Desde la gestión financiera hasta métricas de rendimiento académico.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up animation-delay-300">
            <Link href="/login" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-white rounded-full px-8 p-6 text-lg font-semibold transition-all hover:scale-105 shadow-xl shadow-slate-900/10 gap-2">
                Ingresar al Dashboard <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Features Grid */}
        <section className="container mx-auto px-6 mt-32 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Todo lo que tu instituto necesita
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Herramientas poderosas diseñadas para optimizar el tiempo administrativo y mejorar el impacto pedagógico.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/60 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                Gestión de Personas
              </h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Administra los perfiles de tus profesores y alumnos en un solo lugar. Asigna cursos, revisa el estado de matrícula y mantén el control total.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/60 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <DollarSign className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                Finanzas y Pagos
              </h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Administración clara de ingresos y gastos. Registra el pago de cuotas mensuales y visualiza la rentabilidad del instituto.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/60 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-orange-500/5 hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BookOpen className="w-7 h-7 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                Reportes Académicos
              </h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Seguimiento exacto de asistencias y notas. Genera reportes académicos transparentes al instante para entregar a alumnos o tutores.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/60 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                Métricas de Dificultad
              </h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Gráficas y analíticas que ayudan a visualizar rápidamente qué temas le costaron más a un alumno individual o a un curso entero.
              </p>
            </div>

            {/* Feature 5 (Coming Soon) */}
            <div className="group relative bg-gradient-to-br from-violet-600 to-indigo-700 rounded-3xl p-8 shadow-xl shadow-indigo-600/20 hover:-translate-y-1 transition-all duration-300 md:col-span-2 lg:col-span-2 overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] rounded-full pointer-events-none" />

              <div className="absolute top-6 right-8">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                  <Sparkles className="w-3 h-3" /> Próximamente
                </span>
              </div>

              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Gamepad2 className="w-7 h-7 text-white" />
              </div>

              <h3 className="text-2xl font-bold text-white mb-3 pr-32">
                Playground Pedagógico
              </h3>
              <p className="text-indigo-100 leading-relaxed max-w-xl text-lg">
                Ayudamos al proceso de aprendizaje activo. Los alumnos podrán acceder a un entorno interactivo para practicar con <strong>ejercicios globales y personalizados</strong>, adaptándose a su nivel y reforzando los temas que más necesitan repasar.
              </p>
            </div>

          </div>
        </section>

        {/* Contact Form Section */}
        <section id="contacto" className="container mx-auto px-6 mt-32 relative z-10 max-w-4xl scroll-mt-24">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 border border-slate-200/60 dark:border-slate-800 shadow-xl shadow-indigo-500/5">
            <div className="text-center mb-10">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                ¿Listo para modernizar tu instituto?
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Déjanos tus datos y nos pondremos en contacto contigo para habilitarte una prueba gratuita.
              </p>
            </div>

            <form className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Nombre completo
                  </label>
                  <input
                    id="name"
                    type="text"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                    placeholder="Ej. Juan Pérez"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Correo electrónico
                  </label>
                  <input
                    id="email"
                    type="email"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                    placeholder="juan@instituto.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="institute" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Nombre de tu Instituto
                </label>
                <input
                  id="institute"
                  type="text"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                  placeholder="Ej. Lingua Academy"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  ¿Tienes alguna consulta o inquietud especial? (Opcional)
                </label>
                <textarea
                  id="message"
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 resize-y"
                  placeholder="Cuéntanos un poco sobre cuántos alumnos manejas o qué desafíos administrativos tiene tu instituto hoy..."
                />
              </div>
              <Button type="button" className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-6 text-lg font-bold shadow-lg shadow-indigo-500/25 transition-all">
                Solicitar Prueba Gratuita <Sparkles className="w-5 h-5" />
              </Button>
            </form>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 mt-16 pb-12 pt-16">
        <div className="container mx-auto px-6 flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-2 mb-4 opacity-50 grayscale">
            <GraduationCap className="w-5 h-5" />
            <span className="font-bold text-lg">Lingua Campus</span>
          </div>
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} Lingua Campus. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
