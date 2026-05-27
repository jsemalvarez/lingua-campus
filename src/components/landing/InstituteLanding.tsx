"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Lato } from "next/font/google";

const lato = Lato({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  display: "swap",
});
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import {
  GraduationCap,
  ArrowRight,
  Users,
  CheckCircle,
  LogIn,
  Baby,
  Backpack,
  Briefcase,
  Award,
  MessageCircle,
  MonitorSmartphone,
  Sparkles,
  Home,
  BookOpen,
  MapPin,
  Mail,
  Instagram,
  Facebook
} from "lucide-react";
import { Institute } from "@prisma/client";

export default function InstituteLanding({ institute }: { institute: Institute }) {
  // Configured primary color, default to a neutral/elegant indigo if not provided
  const primaryColor = "#38b397";
  const secondaryColor = "#f6a138"; // Amber for highlights
  const accentColor = "#2e3192";

  return (
    <div className="min-h-screen selection:bg-indigo-500/20 dark:selection:bg-white/20 bg-slate-50 dark:bg-slate-950 pb-20 sm:pb-0 scroll-smooth">

      {/* Navigation (Top) */}
      <nav className="fixed top-0 w-full z-50 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 transition-all">
        <div className="container mx-auto px-4 sm:px-6 h-[72px] flex items-center justify-between">
          <Link href="#" className="flex items-center gap-3">
            {institute.logoUrl ? (
              <div className="relative w-11 h-11 flex-shrink-0 rounded-xl overflow-hidden shadow-md border border-slate-200 dark:border-slate-800 bg-white">
                <Image
                  src={institute.logoUrl}
                  alt={`Logo de ${institute.name}`}
                  fill
                  sizes="44px"
                  className="object-cover"
                />
              </div>
            ) : (
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-xl shadow-md"
                style={{ backgroundColor: primaryColor }}
              >
                {institute.name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {institute.name}
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden sm:flex items-center gap-8 font-semibold text-sm text-slate-600 dark:text-slate-300">
            <Link href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Inicio</Link>
            <Link href="#cursos" className="hover:text-slate-900 dark:hover:text-white transition-colors">Cursos</Link>
            <Link href="#nosotros" className="hover:text-slate-900 dark:hover:text-white transition-colors">Nosotros</Link>
            <Link href="#metodologia" className="hover:text-slate-900 dark:hover:text-white transition-colors">Metodología</Link>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/login">
              <Button
                className="text-white shadow-md transition-transform hover:scale-105 rounded-full px-6 h-10"
                style={{ backgroundColor: primaryColor }}
              >
                <LogIn className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Ingresar</span>
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Navigation (Mobile Bottom App-Bar) */}
      <nav className="sm:hidden fixed bottom-0 w-full z-50 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.05)] dark:shadow-[0_-5px_40px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-around h-16 px-2">
          <Link href="#" className="flex flex-col items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
            <Home size={20} />
            <span className="text-[10px] font-medium">Inicio</span>
          </Link>
          <Link href="#cursos" className="flex flex-col items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
            <BookOpen size={20} />
            <span className="text-[10px] font-medium">Cursos</span>
          </Link>
          <Link href="#nosotros" className="flex flex-col items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
            <Users size={20} />
            <span className="text-[10px] font-medium">Nosotros</span>
          </Link>
          <Link href="#metodologia" className="flex flex-col items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
            <Sparkles size={20} />
            <span className="text-[10px] font-medium">Elegirnos</span>
          </Link>
        </div>
      </nav>

      <main className="flex flex-col">
        {/* --- SECTION 1: HERO (Light, airy, focused on value) --- */}
        <section className="relative min-h-screen flex items-center justify-center pt-24 pb-20 sm:pb-32 overflow-hidden bg-[#f8fafc] dark:bg-[#0f172a]">
          {/* ── Fondo Decorativo Animado (Mesh Gradients Intensificados) ── */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {/* Blobs Principales */}
            <div
              className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] animate-pulse duration-[10s] opacity-20 dark:opacity-30"
              style={{ backgroundColor: primaryColor }}
            />
            <div
              className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] animate-pulse duration-[8s] delay-1000 opacity-20 dark:opacity-30"
              style={{ backgroundColor: secondaryColor }}
            />

            {/* Blobs Secundarios para mayor color */}
            <div className="absolute top-[20%] right-[-5%] w-[40%] h-[40%] bg-violet-500/15 dark:bg-violet-500/25 rounded-full blur-[100px] animate-bounce-slow delay-500" />
            <div className="absolute w-[35%] h-[35%] bg-rose-500/10 dark:bg-rose-500/20 rounded-full blur-[100px] animate-pulse duration-[12s]" style={{ top: '40%', left: '-5%' }} />

            <div className="absolute top-[10%] left-[30%] w-[25%] h-[25%] bg-blue-500/10 dark:bg-blue-300/15 rounded-full blur-[80px] animate-float" />

            {/* Patrón de puntos sutil */}
            <div className="absolute inset-0 opacity-[0.05] dark:opacity-[0.1]"
              style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '40px 40px' }}
            />
          </div>

          <div className="container mx-auto px-6 text-center max-w-5xl relative z-10 mt-16 sm:mt-0">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm text-slate-700 dark:text-slate-300 font-medium text-sm mb-8 border border-white/50 dark:border-slate-800/50 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Sparkles className="w-4 h-4" style={{ color: secondaryColor }} />
              <span>Inscripciones Abiertas {new Date().getFullYear()}</span>
            </div>

            <h2 className={`text-3xl sm:text-4xl lg:text-5xl italic mb-2 animate-in fade-in slide-in-from-bottom-5 duration-700 ${lato.className}`} style={{ color: primaryColor }}>be Modern, speak English</h2>
            <h1 className="text-7xl sm:text-8xl lg:text-9xl text-slate-900 dark:text-white leading-[1.1] mb-8 animate-in fade-in slide-in-from-bottom-5 duration-700 block drop-shadow-sm" style={{ fontFamily: "'KH Blackline Script', cursive", fontWeight: "normal" }}>
              {/* {institute.name} */}
              Modern English <br className="hidden sm:block" />
              School
            </h1>

            <p className="text-lg sm:text-2xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-1000 font-medium drop-shadow-sm">
              Transformá tu manera de comunicarte. Aprender inglés en nuestra academia te abre las puertas al mundo, a nuevas culturas y a mejores oportunidades.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000">
              <Link href="/inscription" className="w-full sm:w-auto">
                <Button
                  className="w-full sm:w-auto text-white rounded-full px-10 py-7 text-lg font-bold transition-all hover:scale-105 shadow-xl gap-2"
                  style={{ backgroundColor: primaryColor, boxShadow: `0 10px 25px -5px ${primaryColor}50` }}
                >
                  Postulate Ahora <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="#cursos" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto rounded-full px-10 py-7 text-lg font-bold transition-all hover:bg-white/90 dark:hover:bg-slate-800/90 backdrop-blur-sm border-slate-300 dark:border-slate-700 shadow-sm"
                >
                  Ver Cursos de Inglés
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* --- SECTION 2: ACADEMIC OFFER (Parallax Background + Glassmorphism Cards) --- */}
        <section id="cursos" className="py-24 sm:py-32 relative text-white bg-fixed bg-center bg-cover bg-no-repeat overflow-hidden border-y border-white/10 dark:border-slate-800/50" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2560&auto=format&fit=crop')" }}>
          {/* Heavy dark overlay for contrast */}
          <div className="absolute inset-0 bg-slate-950/80 mix-blend-multiply z-0" />
          {/* Brand color tint overlay */}
          <div className="absolute inset-0 opacity-40 mix-blend-color z-0" style={{ backgroundColor: primaryColor }} />

          <div className="container mx-auto px-6 max-w-7xl relative z-10">
            <div className="flex flex-col md:flex-row gap-12 items-end mb-16">
              <div className="flex-1 text-left">
                <h2 className="text-sm font-bold tracking-widest uppercase mb-3 text-slate-300">Cursos de Inglés</h2>
                <h3 className="text-4xl sm:text-5xl font-black text-white leading-tight drop-shadow-lg">
                  Un curso de inglés <br />para cada etapa.
                </h3>
              </div>
              <div className="flex-1 md:text-right">
                <p className="text-slate-200 text-lg sm:text-xl max-w-lg md:ml-auto drop-shadow-md">
                  Metodología de enseñanza de idiomas adaptada a las necesidades cognitivas y objetivos de cada grupo etario.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-8 sm:gap-12 relative z-10">
              {[
                { icon: Baby, title: "Niños", desc: "Aprendizaje lúdico y natural a través de juegos y música." },
                { icon: Backpack, title: "Adolescentes", desc: "Enfoque dinámico para su futuro académico y profesional." },
                { icon: Briefcase, title: "Adultos", desc: "Horarios flexibles y dinámicas reales de conversación." },
                { icon: Award, title: "Exámenes", desc: "Preparación intensiva para FCE, CAE, TOEFL y más." },
              ].map((item, idx) => {
                const isEven = idx % 2 === 0;
                return (
                  <div key={idx} className={`flex w-full ${isEven ? 'justify-start' : 'justify-end'}`}>
                    <div className="w-full md:w-1/2 lg:w-[45%]">
                      {/* Outer Card (First Border & Strong Blur) */}
                      <div className="p-1.5 sm:p-2.5 shadow-xl bg-white/40 dark:bg-slate-900/30 backdrop-blur-2xl rounded-[2.5rem] border border-white/50 dark:border-slate-700/40 group transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.4)]">
                        {/* Inner Card (Second Border & Solid Content) */}
                        <div className="bg-white/80 dark:bg-slate-900/80 p-8 sm:p-10 rounded-[2rem] border border-white/60 dark:border-slate-700/60 h-full flex flex-col items-start relative overflow-hidden">
                          {/* Inner glow on hover */}
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-br from-transparent to-black dark:to-white pointer-events-none" />

                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[1.5rem] flex items-center justify-center mb-6 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3 shadow-md bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700" style={{ color: primaryColor }}>
                            <item.icon className="w-8 h-8 sm:w-10 sm:h-10" />
                          </div>

                          <h4 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">{item.title}</h4>
                          <p className="text-slate-600 dark:text-slate-400 text-lg font-medium leading-relaxed">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* --- SECTION 2.5: ABOUT US (Solid Light/Dark Block) --- */}
        <section id="nosotros" className="py-24 sm:py-32 bg-slate-50 dark:bg-slate-900 border-t border-slate-200/50 dark:border-slate-800/50">
          <div className="container mx-auto px-6 max-w-5xl relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-sm font-bold tracking-widest uppercase mb-3" style={{ color: accentColor }}>Tu Academia de Inglés</h2>
              <h3 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white mb-6 leading-tight">
                Más que un instituto de inglés, <br className="hidden sm:block" /> una comunidad.
              </h3>
              <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                Con años de trayectoria formando alumnos bilingües, nuestro equipo de profesores de inglés está enfocado en brindarte las herramientas exactas para dominar el idioma en el mundo real.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-8">
              <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl text-center shadow-lg border border-slate-100 dark:border-slate-700 transition-transform hover:-translate-y-1">
                <div className="text-4xl sm:text-5xl font-black mb-2 text-slate-900 dark:text-white">+{new Date().getFullYear() - 1996}</div>
                <div className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Años de Exp.</div>
              </div>
              <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl text-center shadow-lg border border-slate-100 dark:border-slate-700 transition-transform hover:-translate-y-1">
                <div className="text-4xl sm:text-5xl font-black mb-2 text-slate-900 dark:text-white">+200</div>
                <div className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Alumnos Activos</div>
              </div>
              <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl text-center shadow-lg border border-slate-100 dark:border-slate-700 transition-transform hover:-translate-y-1">
                <div className="text-4xl sm:text-5xl font-black mb-2 text-slate-900 dark:text-white">100%</div>
                <div className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Aprobados Ex.</div>
              </div>
            </div>
          </div>
        </section>

        {/* --- SECTION 3: METHODOLOGY / VALUE PROP (Diagonal Gradient / Clean Contrast) --- */}
        <section id="metodologia" className="py-24 sm:py-32 relative overflow-hidden bg-white dark:bg-[#0B1120] border-t border-slate-200/50 dark:border-slate-800/50">
          {/* Symmetrical Background Effect (Top-Left to Bottom-Right) */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full blur-[120px] opacity-25 dark:opacity-40 transition-all duration-1000" style={{ backgroundColor: primaryColor }} />
            <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] rounded-full blur-[120px] opacity-25 dark:opacity-40 transition-all duration-1000" style={{ backgroundColor: primaryColor }} />
          </div>

          {/* Content Container */}
          <div className="container mx-auto px-6 max-w-6xl relative z-10">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-sm font-bold tracking-widest uppercase mb-3" style={{ color: primaryColor }}>Por qué estudiar inglés con nosotros</h2>
                <h3 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-8 leading-[1.1] text-slate-900 dark:text-white">
                  Una experiencia <br />
                  <span style={{ color: secondaryColor }}>inmersiva para aprender.</span>
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-lg sm:text-xl mb-12 font-medium leading-relaxed max-w-md">
                  Rompemos la estructura tradicional de las academias de idiomas. Generamos dinámicas de interacción constante para un aprendizaje real y motivador del idioma inglés.
                </p>

                <div className="space-y-6">
                  <div className="flex gap-5 items-start p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
                    <CheckCircle className="w-8 h-8 flex-shrink-0" style={{ color: primaryColor }} />
                    <div>
                      <h4 className="text-xl font-black mb-1 text-slate-900 dark:text-white">Grupos Reducidos</h4>
                      <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed">Atención personalizada y seguimiento continuo de cada alumno.</p>
                    </div>
                  </div>
                  <div className="flex gap-5 items-start p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
                    <CheckCircle className="w-8 h-8 flex-shrink-0" style={{ color: primaryColor }} />
                    <div>
                      <h4 className="text-xl font-black mb-1 text-slate-900 dark:text-white">Enfoque Comunicativo</h4>
                      <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed">Hablar, escuchar e interactuar son la base desde la primera clase.</p>
                    </div>
                  </div>
                  <div className="flex gap-5 items-start p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
                    <MonitorSmartphone className="w-8 h-8 flex-shrink-0" style={{ color: secondaryColor }} />
                    <div>
                      <h4 className="text-xl font-black mb-1 text-slate-900 dark:text-white">Campus Virtual Exclusivo</h4>
                      <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed">Nuestra App PWA integrada para alumnos. Notas, asistencia y autogestión 24/7 en tu celular.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Visual Tech/Education Element */}
              <div className="relative h-[500px] rounded-[3rem] border border-slate-200/60 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 backdrop-blur-sm overflow-hidden flex items-center justify-center group shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-white dark:from-slate-800 to-transparent opacity-60"></div>
                <div className="text-center p-8 transition-transform duration-700 group-hover:scale-105 relative z-10">
                  <div className="w-28 h-28 mx-auto bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mb-8 shadow-md border border-slate-100 dark:border-slate-700">
                    <GraduationCap className="w-14 h-14 drop-shadow-sm" style={{ color: primaryColor }} />
                  </div>
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">{institute.name}</h3>
                  <div className="inline-flex items-center justify-center gap-2 text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 rounded-full px-6 py-3 font-bold shadow-sm border border-slate-200/50 dark:border-slate-700">
                    Tecnología + Educación
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- SECTION 4: CTA FOOTER PRE TENSION (Inverted Theme mode) --- */}
        <section className="py-24 dark:bg-slate-50" style={{ backgroundColor: primaryColor }}>
          <div className="container mx-auto px-6 text-center max-w-3xl">
            <h2 className="text-4xl font-black text-white dark:text-slate-900 mb-6">Empezá hoy tus clases de inglés</h2>
            <p className="text-xl text-slate-300 dark:text-slate-600 mb-10">No dejes para mañana el idioma que te abrirá las puertas del mundo hoy.</p>
            <Link href="/inscription">
              <Button
                className="text-white rounded-full px-12 py-8 text-xl font-bold shadow-xl hover:-translate-y-1 transition-transform"
                style={{ backgroundColor: secondaryColor }}
              >
                Inscribirse Ahora
              </Button>
            </Link>
          </div>
        </section>

        {/* --- FLOATING WHATSAPP BUTTON --- */}
        {institute.whatsappNumber && (
          <a
            href={`https://wa.me/${institute.whatsappNumber.replace(/[^0-9]/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-24 sm:bottom-8 right-4 sm:right-8 z-[60] bg-[#25D366] text-white p-3 sm:p-4 rounded-full shadow-[0_8px_30px_rgba(37,211,102,0.4)] hover:scale-110 transition-transform duration-300 flex items-center justify-center group"
            aria-label="Contactar por WhatsApp"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 sm:w-8 sm:h-8">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
            </svg>
          </a>
        )}
      </main>

      {/* --- FOOTER PRINCIPAL 3 COLUMNAS --- */}
      <footer className="bg-white dark:bg-slate-950 pt-20 pb-24 sm:pb-10 border-t border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 mb-16">

            {/* Columna 1: Enlaces Rápidos */}
            <div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Navegación</h4>
              <ul className="space-y-4">
                <li><Link href="#" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Inicio</Link></li>
                <li><Link href="#cursos" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Cursos</Link></li>
                <li><Link href="#nosotros" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Sobre Nosotros</Link></li>
                <li><Link href="#metodologia" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Por qué elegirnos</Link></li>
              </ul>
            </div>

            {/* Columna 2: Contacto */}
            <div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Contacto</h4>
              <ul className="space-y-4 text-slate-600 dark:text-slate-400">
                {institute.address && (
                  <li className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 mt-0.5 opacity-70" style={{ color: primaryColor }} />
                    <span className="leading-relaxed">{institute.address}</span>
                  </li>
                )}
                {institute.whatsappNumber && (
                  <li className="flex items-center gap-3">
                    <MessageCircle className="w-5 h-5 opacity-70" style={{ color: primaryColor }} />
                    <a href={`https://wa.me/${institute.whatsappNumber.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                      {institute.whatsappNumber}
                    </a>
                  </li>
                )}
                {institute.email && (
                  <li className="flex items-center gap-3">
                    <Mail className="w-5 h-5 opacity-70" style={{ color: primaryColor }} />
                    <a href={`mailto:${institute.email}`} className="hover:text-slate-900 dark:hover:text-white transition-colors">
                      {institute.email}
                    </a>
                  </li>
                )}
                {!institute.address && !institute.whatsappNumber && !institute.email && (
                  <li>Contactate a través de nuestro campus virtual.</li>
                )}
              </ul>
            </div>

            {/* Columna 3: Redes Sociales */}
            <div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Comunidad</h4>
              <div className="flex items-center gap-4">
                {institute.instagramUrl && (
                  <a href={institute.instagramUrl} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-500/20 dark:hover:text-rose-400 transition-colors shadow-sm border border-slate-200/50 dark:border-slate-800">
                    <Instagram className="w-5 h-5" />
                  </a>
                )}
                {institute.facebookUrl && (
                  <a href={institute.facebookUrl} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-500/20 dark:hover:text-blue-400 transition-colors shadow-sm border border-slate-200/50 dark:border-slate-800">
                    <Facebook className="w-5 h-5" />
                  </a>
                )}
                {!institute.instagramUrl && !institute.facebookUrl && (
                  <p className="text-slate-500 text-sm">Pronto nos encontrarás en redes sociales.</p>
                )}
              </div>
            </div>
          </div>

          {/* Copyright y Firma */}
          <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-sm font-medium">
              © {new Date().getFullYear()} {institute.name}. Todos los derechos reservados.
            </p>
            <p className="text-slate-400 text-xs flex justify-center items-center gap-1">
              Plataforma impulsada por <span className="font-bold text-slate-600 dark:text-slate-300">Lingua Campus</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
