"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import {
  Users, BookOpen, DollarSign, ArrowRight, GraduationCap, Sparkles,
  BarChart3, Menu, X, LogIn, ShieldCheck, FileKey, Zap, PieChart,
  Undo2, CheckCircle2, Mic2, Headphones, MessageSquare, QrCode,
  UserCheck, Smartphone, Bell, ClipboardList, Star, Cake,
  MonitorSmartphone, Shield, ChevronRight, Award,
  Instagram, Facebook, Linkedin, Youtube, Twitter,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

// ─── Animated Counter ────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1600, trigger = false) {
  const [count, setCount] = React.useState(0);
  React.useEffect(() => {
    if (!trigger) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [trigger, target, duration]);
  return count;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  // Stats counter
  const statsRef = React.useRef<HTMLDivElement>(null);
  const [statsTriggered, setStatsTriggered] = React.useState(false);
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setStatsTriggered(true);
      },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);
  const adminTimeCount = useCountUp(70, 1400, statsTriggered);
  const prepTimeCount = useCountUp(50, 1600, statsTriggered);
  const digitalPercentCount = useCountUp(100, 1800, statsTriggered);

  // Contact Form State
  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    institute: "",
    students: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitStatus, setSubmitStatus] = React.useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = React.useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");
    setErrorMessage("");

    try {
      const response = await fetch("https://formsubmit.co/ajax/16dca3c641051a19745fd86a30bcab1d", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          institute: formData.institute,
          students: formData.students,
          message: formData.message,
          _subject: "Nueva consulta desde la Web de Lingua Campus!"
        }),
      });

      if (!response.ok) {
        throw new Error("Response not ok");
      }

      const result = await response.json();
      if (result.success === "false") {
        throw new Error(result.message || "Error al enviar");
      }

      setSubmitStatus("success");
      setFormData({
        name: "",
        email: "",
        institute: "",
        students: "",
        message: ""
      });
    } catch (error) {
      console.error(error);
      setSubmitStatus("error");
      setErrorMessage("Error al enviar el formulario. Intenta de nuevo más tarde por favor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-white dark:bg-slate-950 font-sans selection:bg-indigo-500/30 overflow-x-hidden">

      {/* ══ NAV ════════════════════════════════════════════════════════════ */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 group shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <GraduationCap className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300">
              Lingua Campus
            </span>
          </div>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-400">
            <a href="#practica-ia" className="hover:text-slate-900 dark:hover:text-white transition-colors">Práctica IA</a>
            <a href="#asistencia-qr" className="hover:text-slate-900 dark:hover:text-white transition-colors">QR</a>
            <a href="#para-quien" className="hover:text-slate-900 dark:hover:text-white transition-colors">¿Para quién?</a>
            <a href="#finanzas" className="hover:text-slate-900 dark:hover:text-white transition-colors">Finanzas</a>
          </div>

          <div className="hidden sm:flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" className="font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">
                Acceder
              </Button>
            </Link>
            <a href="#contacto">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25 rounded-full px-6 transition-all hover:scale-105 hover:-translate-y-0.5">
                Demo Gratuita
              </Button>
            </a>
          </div>

          {/* Mobile */}
          <div className="flex sm:hidden items-center gap-1">
            <ThemeToggle />
            <Link href="/login" className="p-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <LogIn size={20} />
            </Link>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        <div className={`sm:hidden overflow-hidden transition-all duration-300 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-t border-slate-200/50 dark:border-slate-800/50 ${isMobileMenuOpen ? "max-h-56 opacity-100" : "max-h-0 opacity-0"}`}>
          <div className="container mx-auto px-4 py-4 flex flex-col gap-3">
            <a href="#practica-ia" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium text-slate-600 dark:text-slate-400 py-1">Práctica IA</a>
            <a href="#asistencia-qr" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium text-slate-600 dark:text-slate-400 py-1">QR</a>
            <a href="#para-quien" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium text-slate-600 dark:text-slate-400 py-1">¿Para quién?</a>
            <a href="#contacto" onClick={() => setIsMobileMenuOpen(false)}>
              <Button className="w-full justify-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-full">Demo Gratuita</Button>
            </a>
          </div>
        </div>
      </nav>

      <main className="relative">

        {/* ══ SECCIÓN 1: HERO — Responsive Layout (Mobile: Top Image with Vertical Fade | Desktop: Split Viewport) ════════════════ */}
        <section className="relative min-h-fit lg:h-screen lg:min-h-[700px] flex flex-col lg:flex-row lg:items-center bg-slate-950 overflow-hidden pt-16 lg:pt-0 pb-12 lg:pb-0">

          {/* Background/Top Image Container */}
          {/* On mobile/tablet: block element at the top. On desktop: absolute positioned on the right 2/3 */}
          <div className="relative lg:absolute right-0 top-0 bottom-0 w-full lg:w-2/3 h-[240px] sm:h-[360px] lg:h-full z-0 select-none pointer-events-none shrink-0">
            <div className="relative w-full h-full">
              <Image
                src="/hero_background.png"
                alt="Lingua Campus AI Assistant"
                fill
                priority
                className="object-cover object-[60%_center]"
              />
              {/* Desktop Fade gradient: Right-to-left */}
              <div className="hidden lg:block absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/60 to-transparent" />

              {/* Mobile/Tablet Fade gradient: Top-to-bottom (blends the bottom of the image into the solid slate-950 below) */}
              <div className="block lg:hidden absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/40 to-slate-950" />
            </div>
          </div>

          {/* Text Content Container (sits below the image on mobile, overlays on desktop) */}
          <div className="container mx-auto px-6 max-w-7xl relative z-10 py-6 sm:py-10 lg:py-0 lg:mb-16">
            <div className="flex flex-col lg:grid lg:grid-cols-12 lg:gap-12 items-center">

              {/* Columna Texto: ocupa ancho completo en móvil y 5/12 columnas en desktop */}
              {/* Posicionado 100% sobre el fondo oscuro sólido de la izquierda para legibilidad perfecta */}
              <div className="w-full col-span-12 lg:col-span-5 flex flex-col gap-5 lg:gap-6 max-w-lg">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-355 font-semibold text-xs sm:text-sm border border-indigo-500/20 shadow-sm w-fit">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Software de gestión para institutos de idiomas</span>
                </div>

                <h1 className="text-3xl sm:text-5xl lg:text-6.5xl font-extrabold tracking-tight text-white leading-[1.1]">
                  Tu instituto.<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
                    Potenciado con IA.
                  </span>
                </h1>

                <p className="text-sm sm:text-lg text-slate-300 leading-relaxed">
                  Gestión administrativa completa, práctica con inteligencia artificial, asistencia por QR y portales personalizados para cada rol. Todo en una sola plataforma.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-1 lg:mt-2">
                  <a href="#contacto" className="w-full sm:w-auto">
                    <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-4 lg:px-8 lg:py-6 text-sm lg:text-base font-bold shadow-xl shadow-indigo-500/25 gap-2 transition-all hover:scale-105">
                      Solicitar Demo <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </Button>
                  </a>
                  <Link href="/login" className="w-full sm:w-auto">
                    <Button variant="outline" className="w-full rounded-full px-6 py-4 lg:px-8 lg:py-6 text-sm lg:text-base font-bold border-slate-800 text-white hover:bg-slate-900 gap-2">
                      <LogIn className="w-4 h-4 sm:w-5 sm:h-5" />
                      Acceder
                    </Button>
                  </Link>
                </div>

                {/* 4 Quick features below CTAs (Mobile & Tablet only) */}
                <div className="grid lg:hidden grid-cols-2 gap-4 pt-4 sm:pt-6 border-t border-slate-800 mt-1 lg:mt-2">
                  {[
                    { icon: Mic2, label: "Práctica IA", sub: "Speaking · Listening · Chat" },
                    { icon: QrCode, label: "Asistencia QR", sub: "Sin listas de papel" },
                    { icon: DollarSign, label: "Finanzas", sub: "Ledger inmutable" },
                    { icon: Users, label: "Multi-rol", sub: "Admin · Docente · Alumno · Tutor" },
                  ].map((f) => (
                    <div key={f.label} className="flex items-center gap-3">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                        <f.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-white leading-none">{f.label}</p>
                        <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">{f.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Columna derecha vacía en desktop (7 de 12 columnas) para evitar que el texto pise el holograma y el robot */}
              <div className="hidden lg:block lg:col-span-7 h-[100px]" />

            </div>
          </div>

          {/* 4 Quick features bar (Desktop only - centered horizontally at the very bottom of the Hero with thin gridline borders) */}
          {/* Lighter borders (slate-800/80) are used to make the grids stand out beautifully on the dark background */}
          <div className="hidden lg:flex absolute bottom-0 inset-x-0 bg-slate-950/30 backdrop-blur-md border-t border-slate-800/85 z-20">
            <div className="container mx-auto max-w-7xl px-6">
              <div className="grid grid-cols-4 border-x border-slate-800/85">
                {[
                  { icon: Mic2, label: "Práctica IA", sub: "Speaking · Listening · Chat" },
                  { icon: QrCode, label: "Asistencia QR", sub: "Sin listas de papel" },
                  { icon: DollarSign, label: "Finanzas", sub: "Ledger inmutable" },
                  { icon: Users, label: "Multi-rol", sub: "Admin · Docente · Alumno · Tutor" },
                ].map((f) => (
                  <div
                    key={f.label}
                    className="flex items-center justify-center gap-4 py-7 px-6 border-r border-slate-800/85 last:border-r-0 hover:bg-white/[0.02] transition-all duration-300 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-500/20 group-hover:scale-105 transition-all duration-300">
                      <f.icon className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-white leading-none tracking-wide group-hover:text-indigo-300 transition-colors">{f.label}</p>
                      <p className="text-xs text-slate-450 mt-1.5 leading-none">{f.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ══ SECCIÓN 2: PRÁCTICA CON IA ════════════════════════════════════ */}
        <section id="practica-ia" className="bg-slate-950 py-24 sm:py-32 relative overflow-hidden">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-indigo-600/20 blur-[140px] pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-violet-700/15 blur-[120px] pointer-events-none" />

          <div className="container mx-auto px-6 max-w-7xl relative z-10">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/40 bg-indigo-500/10 text-indigo-300 text-sm font-semibold mb-6">
                <Zap className="w-4 h-4" />
                Diferencial exclusivo
              </div>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-6">
                Práctica con IA,{" "}
                <span className="text-indigo-400 font-bold">
                  incluida en cada clase.
                </span>
              </h2>
              <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
                El profesor carga el material y la IA lo convierte en práctica interactiva para el alumno. Sin apps externas, sin costo adicional.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Mockup */}
              <div className="relative">
                <div className="relative rounded-[2.5rem] overflow-hidden border border-white/10 shadow-[0_32px_80px_rgba(99,102,241,0.25)] group">
                  <Image src="/mockup-ai-practice.png" alt="Módulo de Práctica IA" width={600} height={700} className="w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />
                </div>
                <div className="absolute -bottom-4 -right-4 sm:-bottom-6 sm:-right-6 bg-white dark:bg-slate-900 rounded-2xl px-5 py-3 shadow-2xl border border-slate-200/50 dark:border-slate-700 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Precisión promedio</p>
                    <p className="text-lg font-black text-slate-900 dark:text-white">92% Speaking</p>
                  </div>
                </div>
              </div>

              {/* Contenido interactivo */}
              <div className="flex flex-col gap-8">
                {[
                  {
                    icon: Mic2,
                    title: "Speaking & Pronunciación",
                    desc: "La IA escucha al estudiante, evalúa su fluidez y fonética en tiempo real, devolviendo feedback de pronunciación detallada palabra por palabra."
                  },
                  {
                    icon: Headphones,
                    title: "Listening Inteligente",
                    desc: "Generación de diálogos contextuales adaptados al vocabulario de la clase. El alumno escucha y responde de acuerdo al nivel del curso."
                  },
                  {
                    icon: MessageSquare,
                    title: "Chat de Simulación Real",
                    desc: "Escenarios interactivos donde el alumno mantiene una conversación fluida con la IA simulando situaciones reales (hoteles, aeropuertos, entrevistas)."
                  }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4 p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                      <item.icon className="w-6 h-6 text-indigo-405" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                      <p className="text-slate-400 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ══ SECCIÓN 3: ASISTENCIA POR QR ══════════════════════════════════ */}
        <section id="asistencia-qr" className="py-24 sm:py-32 bg-white dark:bg-slate-950 relative overflow-hidden">
          <div className="container mx-auto px-6 max-w-7xl relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

              {/* Contenido izquierda */}
              <div className="flex flex-col gap-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-sm border border-emerald-100 dark:border-emerald-500/20 shadow-sm w-fit">
                  <QrCode className="w-4 h-4" />
                  <span>Cero fricción</span>
                </div>

                <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                  Presentes al instante.<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">
                    Asistencia con código QR.
                  </span>
                </h2>

                <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                  Olvidate de las planillas de asistencia impresas o las llamadas manuales. Los estudiantes escanean el QR dinámico del aula desde su celular y quedan registrados en tiempo real en la base de datos de administración.
                </p>

                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-900">
                  {[
                    { step: "01", label: "El profesor proyecta el QR del aula en segundos." },
                    { step: "02", label: "El alumno escanea el código desde la app o su portal." },
                    { step: "03", label: "Administración recibe el presente en el acto." }
                  ].map((s) => (
                    <div key={s.step} className="flex items-center gap-3">
                      <span className="text-emerald-500 dark:text-emerald-400 font-extrabold text-lg">{s.step}</span>
                      <span className="text-slate-700 dark:text-slate-300 font-medium">{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mockup derecha */}
              <div className="relative">
                <div className="relative rounded-[2.5rem] overflow-hidden border border-slate-200/60 dark:border-slate-800 shadow-2xl group">
                  <Image src="/mockup-qr-flow.png" alt="Asistencia QR" width={600} height={700} className="w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]" />
                </div>
                <div className="absolute -top-4 -left-4 sm:-top-6 sm:-left-6 bg-emerald-500 text-white rounded-2xl px-5 py-3 shadow-xl flex items-center gap-2 font-bold animate-bounce">
                  <UserCheck className="w-5 h-5" />
                  <span>Presente registrado</span>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ══ SECCIÓN 4: CADA UNO TIENE SU LUGAR (ROLES) ════════════════════ */}
        <section id="para-quien" className="py-24 sm:py-32 bg-slate-50 dark:bg-slate-900/40 relative overflow-hidden">
          <div className="container mx-auto px-6 max-w-7xl relative z-10">
            <div className="text-center mb-20">
              <h2 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white leading-tight mb-6">
                Una experiencia integrada.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
                  Cada uno tiene su lugar.
                </span>
              </h2>
              <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                Lingua Campus provee portales dedicados y totalmente personalizados para los distintos miembros de la comunidad educativa.
              </p>
            </div>

            {/* Fila de Cards Alternadas (Scrolleables) */}
            <div className="flex flex-col gap-24">
              {[
                {
                  role: "Directores y Administradores",
                  subtitle: "El corazón del instituto bajo control absoluto",
                  desc: "Gestioná matrículas, cursos, cobro de cuotas, sueldos de docentes e indicadores clave desde un panel central potente y sencillo.",
                  features: ["Cobranzas & Ledger inmutable", "Liquidación de docentes", "Dashboard de ganancias & KPIs", "Control de morosidad", "Gestión masiva de cursos", "Reportes listos para imprimir"],
                  image: "/mockup-admin-dashboard.png",
                  badge: "Administración",
                  theme: "indigo"
                },
                {
                  role: "Profesores y Coordinadores",
                  subtitle: "Menos burocracia, más espacio para enseñar",
                  desc: "Cargá el contenido pedagógico de tu clase y dejá que la IA haga el trabajo pesado de generar la práctica. Tomá asistencia por QR y registrá calificaciones sin planillas manuales.",
                  features: ["Creador de práctica con IA", "Asistidor de QR en el aula", "Carga de calificaciones fluida", "Agenda de clases and alertas", "Seguimiento académico individual", "Comunicación directa con tutores"],
                  image: "/mockup-teacher-dashboard.png",
                  badge: "Docentes",
                  theme: "violet"
                },
                {
                  role: "Estudiantes",
                  subtitle: "Aprendizaje activo e interactivo",
                  desc: "Practicá tu pronunciación, escucha y conversación con la IA inteligente sobre los temas exactos explicados en tu clase presencial. Escaneá tu asistencia en segundos.",
                  features: ["Playground interactivo con IA", "Speaking & listening ilimitado", "Asistencia móvil por QR", "Progreso visual e histórico", "Material de clase centralizado", "Alertas de exámenes y eventos"],
                  image: "/mockup-student-playground.png",
                  badge: "Alumnos",
                  theme: "emerald"
                },
                {
                  role: "Padres y Tutores",
                  subtitle: "Acompañamiento transparente y continuo",
                  desc: "Visualizá el progreso de tus hijos, descargá reportes académicos oficiales y pagá las cuotas mensuales de forma simple sin moverte de casa.",
                  features: ["Visualización de boletines", "Seguimiento de asistencia", "Portal de pago de cuotas", "Descarga de facturas", "Chat directo con el docente", "Notificaciones de fechas clave"],
                  image: "/mockup-student-grades.png",
                  badge: "Tutores",
                  theme: "amber"
                }
              ].map((r, index) => {
                const isEven = index % 2 === 0;
                return (
                  <div key={r.role} className={`grid lg:grid-cols-12 gap-12 items-center ${isEven ? "" : "lg:flex-row-reverse"}`}>

                    {/* Texto del Rol */}
                    <div className={`lg:col-span-5 flex flex-col gap-6 ${isEven ? "lg:order-1" : "lg:order-2"}`}>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400`}>
                          {r.badge}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{r.role}</h3>
                        <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 mb-4">{r.subtitle}</p>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">{r.desc}</p>
                      </div>

                      {/* Lista de features del rol */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-6 border-t border-slate-200 dark:border-slate-800">
                        {r.features.map((f, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            <span className="leading-snug">{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Visual del Rol */}
                    <div className={`lg:col-span-7 ${isEven ? "lg:order-2" : "lg:order-1"} relative`}>
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 rounded-[2rem] blur-2xl" />
                      <div className="relative rounded-[2rem] overflow-hidden border border-slate-200/60 dark:border-slate-800 shadow-xl">
                        <Image src={r.image} alt={r.role} width={700} height={450} className="w-full object-cover" />
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ══ SECCIÓN 5: STATS ANIMADOS ═════════════════════════════════════ */}
        <section ref={statsRef} className="py-20 bg-gradient-to-br from-indigo-600 to-violet-700 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:30px_30px]" />
          <div className="container mx-auto px-6 max-w-7xl relative z-10">
            <div className="grid md:grid-cols-3 gap-12 text-center items-center">
              <div>
                <p className="text-5xl sm:text-6xl font-black mb-2 tracking-tight">-{adminTimeCount}%</p>
                <p className="text-indigo-100 text-sm font-bold uppercase tracking-wider mb-2">Tiempo Administrativo</p>
                <p className="text-xs text-indigo-200 max-w-xs mx-auto leading-relaxed">Menos horas dedicadas a planillas de asistencia en papel, reportes manuales y conciliación de cobranzas.</p>
              </div>
              <div>
                <p className="text-5xl sm:text-6xl font-black mb-2 tracking-tight">-{prepTimeCount}%</p>
                <p className="text-indigo-100 text-sm font-bold uppercase tracking-wider mb-2">Preparación de Clases</p>
                <p className="text-xs text-indigo-200 max-w-xs mx-auto leading-relaxed">La IA asiste en planificar temas y dinámicas interactivas: trivias para Kahoot, canciones, películas y plantillas dinámicas.</p>
              </div>
              <div>
                <p className="text-5xl sm:text-6xl font-black mb-2 tracking-tight">{digitalPercentCount}%</p>
                <p className="text-indigo-100 text-sm font-bold uppercase tracking-wider mb-2">Gestión 100% Digital</p>
                <p className="text-xs text-indigo-200 max-w-xs mx-auto leading-relaxed">Matrículas, asistencia automática por QR de alumnos y borradores de boletines integrados en un único lugar.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ══ SECCIÓN 6: MOTOR FINANCIERO INMUTABLE ═════════════════════════ */}
        <section id="finanzas" className="py-24 sm:py-32 bg-white dark:bg-slate-950 relative overflow-hidden">
          <div className="container mx-auto px-6 max-w-7xl relative z-10">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-sm border border-emerald-100 dark:border-emerald-500/20 shadow-sm mb-6">
                <ShieldCheck className="w-4 h-4" />
                <span>Tranquilidad total</span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white leading-tight mb-6">
                Motor financiero con<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">
                  ledger de contabilidad inmutable.
                </span>
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                La seguridad financiera de tu instituto no se negocia. Lingua Campus registra cada transacción en un ledger permanente e inalterable, evitando errores humanos.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  icon: FileKey,
                  title: "Transacciones Firmadas",
                  desc: "Cada ingreso y egreso se registra con firma de auditoría, impidiendo ediciones maliciosas del historial."
                },
                {
                  icon: ShieldCheck,
                  title: "Previsión de Errores",
                  desc: "Sistema inteligente de doble entrada que previene descuadres comunes antes de impactar en la caja."
                },
                {
                  icon: Sparkles,
                  title: "Facturación Dinámica",
                  desc: "Generá las cuotas mensuales de todo tu alumnado en un solo clic y envialas por email de manera automatizada."
                },
                {
                  icon: PieChart,
                  title: "Rentabilidad por Aula",
                  desc: "Visualizá qué cursos y horarios tienen mayor margen económico y planificá tu crecimiento de forma inteligente."
                }
              ].map((card, idx) => (
                <div key={idx} className="p-8 rounded-3xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-6">
                    <card.icon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{card.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* ══ SECCIÓN: CLIENTES FUNDADORES ══════════════════════════════════ */}
        <section className="py-24 sm:py-32 bg-slate-50 dark:bg-slate-950 relative overflow-hidden transition-colors">
          {/* Subtle background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-indigo-500/10 dark:bg-indigo-500/5 blur-[120px] pointer-events-none" />

          <div className="container mx-auto px-6 max-w-5xl relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white leading-tight mb-6">
                El primer instituto en confiar su gestión a <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400">Lingua Campus</span>
              </h2>
              <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
                Así fue cómo <a href="https://www.modernenglishschool.com.ar" target="_blank" rel="noopener noreferrer" className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">Modern English School</a> dejó atrás las planillas sueltas y ordenó su día a día académico.
              </p>
            </div>

            {/* Testimonial Card Container */}
            <div className="relative mx-auto max-w-4xl">

              {/* Floating Badge (Fundador Nº 01) */}
              <div className="absolute -top-6 right-4 sm:right-10 z-20 bg-slate-900 text-white dark:bg-slate-950 border-2 border-amber-500/70 dark:border-amber-500/40 rounded-full w-24 h-24 sm:w-28 sm:h-28 flex flex-col items-center justify-center shadow-2xl rotate-12 hover:rotate-0 transition-transform duration-300 select-none">
                <span className="text-[10px] sm:text-xs font-bold tracking-widest text-amber-500 uppercase">Fundador</span>
                <span className="text-lg sm:text-xl font-black tracking-tight mt-0.5">Nº 01</span>
              </div>

              {/* Main Card */}
              <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-8 sm:p-12 shadow-xl backdrop-blur-sm relative">

                {/* Card Header */}
                <div className="flex items-center gap-4 mb-8 sm:mb-10">
                  {/* Logo Image */}
                  <div className="w-14 h-14 rounded-2xl overflow-hidden border border-slate-250 dark:border-slate-800 bg-white flex items-center justify-center shrink-0 p-2.5">
                    <img
                      src="https://res.cloudinary.com/dwhdla1b4/image/upload/v1784242745/lingua-campus/logo_mes_mjsnim.webp"
                      alt="Modern English School Logo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-tight hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                      <a href="https://www.modernenglishschool.com.ar" target="_blank" rel="noopener noreferrer">
                        Modern English School
                      </a>
                    </h3>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      Mar del Plata, Argentina
                    </p>
                  </div>
                </div>

                {/* Quote Block */}
                <div className="border-l-4 border-amber-500/80 dark:border-amber-500/60 pl-6 mb-8 sm:mb-10">
                  <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 italic leading-relaxed mb-4">
                    "La inteligencia artificial ya es parte del presente, y por eso nos alegra poder sumar herramientas que enriquecen las prácticas, acompañan el proceso de aprendizaje y brindan un valor agregado concreto a nuestros estudiantes."
                  </p>
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
                    — <span className="text-indigo-600 dark:text-indigo-400">Patricia Muñis</span>, Dueña y Directora en <a href="https://www.modernenglishschool.com.ar" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline transition-colors">Modern English School</a>
                  </p>
                </div>

                {/* Stats Row */}
                <div className="pt-8 border-t border-dashed border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-4 text-left">
                  <div>
                    <p className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-500">
                      [200+]
                    </p>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                      alumnos gestionados
                    </p>
                  </div>
                  <div>
                    <p className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-500">
                      [4] módulos
                    </p>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-snug space-y-0.5">
                      gestión pedagógica con IA<br />
                      gestión administrativa<br />
                      marca personal<br />
                      app para celulares
                    </p>
                  </div>
                  <div>
                    <p className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-500">
                      [100]%
                    </p>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                      cobros gestionados digitalmente
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* Bottom CTA Area */}
            <div className="text-center mt-16 max-w-2xl mx-auto">
              <p className="text-slate-600 dark:text-slate-450 mb-6 font-medium text-sm sm:text-base">
                ¿Tu instituto podría ser el próximo? Quedan pocos lugares en el programa de Clientes Fundadores.
              </p>
              <a href="#contacto">
                <Button className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-8 py-6 rounded-full shadow-lg shadow-amber-500/10 transition-all hover:scale-105 hover:-translate-y-0.5 active:scale-95">
                  QUIERO SER CLIENTE FUNDADOR
                </Button>
              </a>
            </div>

          </div>
        </section>

        {/* ══ SECCIÓN 7: FORMULARIO DE CONTACTO — Full Bleed Split Layout ════ */}
        <section id="contacto" className="relative grid lg:grid-cols-12 lg:h-screen lg:min-h-[750px] min-h-[650px] overflow-hidden bg-white dark:bg-slate-950">

          {/* Columna izquierda: Brand-themed contact details with geometric lines */}
          <div className="lg:col-span-5 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-8 sm:p-12 lg:p-20 xl:pl-32 text-white flex flex-col justify-between relative overflow-hidden">
            {/* Intersecting geometric overlay lines mimicking the screenshot */}
            <div className="absolute inset-0 opacity-15 pointer-events-none">
              <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <line x1="-10%" y1="20%" x2="110%" y2="80%" stroke="white" strokeWidth="1.5" />
                <line x1="30%" y1="-10%" x2="70%" y2="110%" stroke="white" strokeWidth="1.5" />
                <line x1="-20%" y1="90%" x2="120%" y2="30%" stroke="white" strokeWidth="1" />
                <line x1="80%" y1="-20%" x2="20%" y2="120%" stroke="white" strokeWidth="1" />
                <circle cx="90%" cy="15%" r="4" fill="white" />
                <circle cx="15%" cy="75%" r="3" fill="white" />
              </svg>
            </div>

            <div className="relative z-10 flex flex-col gap-10">
              <div>
                <h3 className="text-3xl font-black tracking-wider uppercase text-white">
                  Listo para <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-emerald-200">potenciar</span> tu instituto?
                </h3>
              </div>

              <div className="space-y-8">
                <div>
                  <p className="text-xs font-black tracking-widest text-indigo-200 uppercase mb-2">Email</p>
                  <a href="mailto:info.origenmdp@gmail.com" className="text-base text-white/90 hover:text-white transition-colors font-medium">
                    info.origenmdp@gmail.com
                  </a>
                </div>
                <div>
                  <p className="text-xs font-black tracking-widest text-indigo-200 uppercase mb-2">Phone</p>
                  <a href="tel:+5492235551234" className="text-base text-white/90 hover:text-white transition-colors font-medium">
                    +54 9 223 4218873
                  </a>
                </div>
                <div>
                  <p className="text-xs font-black tracking-widest text-indigo-200 uppercase mb-2">Address</p>
                  <p className="text-base text-white/90 font-medium leading-relaxed">
                    Mar del Plata, Buenos Aires, Argentina
                  </p>
                </div>
              </div>
            </div>

            {/* Social media icons (Elsewhere) */}
            <div className="relative z-10 mt-16 lg:mt-0 pt-8 border-t border-white/15">
              <p className="text-xs font-black tracking-widest text-indigo-200 uppercase mb-4">Elsewhere</p>
              <div className="flex gap-3">
                <a href="#" className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all hover:scale-105">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all hover:scale-105">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all hover:scale-105">
                  <Linkedin className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all hover:scale-105">
                  <Youtube className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all hover:scale-105">
                  <Twitter className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>

          {/* Columna derecha: Clean white/slate-950 contact form */}
          <div className="lg:col-span-7 p-8 sm:p-12 lg:p-20 xl:pr-32 bg-white dark:bg-slate-950 flex flex-col justify-center">
            <div>
              <p className="text-base text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                <strong>Comenzá hoy.</strong> Unificá la gestión académica, administrativa y de cobranzas de tu instituto con la potencia de la Inteligencia Artificial. Dejanos tus datos y nos comunicaremos para coordinar una demostración personalizada.
              </p>

              <form onSubmit={handleFormSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <input
                    id="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    className="w-full px-5 py-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm disabled:opacity-60"
                    placeholder="Nombre completo"
                  />
                  <input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    className="w-full px-5 py-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm disabled:opacity-60"
                    placeholder="Correo electrónico"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  <input
                    id="institute"
                    type="text"
                    required
                    value={formData.institute}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    className="w-full px-5 py-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm disabled:opacity-60"
                    placeholder="Nombre del Instituto"
                  />
                  <input
                    id="students"
                    type="text"
                    value={formData.students}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    className="w-full px-5 py-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm disabled:opacity-60"
                    placeholder="Cantidad de alumnos (Opcional)"
                  />
                </div>

                <textarea
                  id="message"
                  rows={5}
                  required
                  value={formData.message}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  className="w-full px-5 py-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none text-sm disabled:opacity-60"
                  placeholder="Mensaje"
                />

                {submitStatus === "success" && (
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-sm font-medium flex items-center gap-2 animate-fadeIn">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span>¡Mensaje enviado con éxito! Nos comunicaremos a la brevedad.</span>
                  </div>
                )}

                {submitStatus === "error" && (
                  <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-800 dark:text-rose-300 text-sm font-medium flex items-center gap-2 animate-fadeIn">
                    <X className="w-5 h-5 text-rose-500 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-600 dark:hover:bg-indigo-500 px-8 py-4 rounded-xl font-black text-xs tracking-widest uppercase transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-indigo-500/20 disabled:opacity-60 disabled:pointer-events-none"
                  >
                    {isSubmitting ? "Enviando..." : "Enviar Mensaje"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>
      </main>

      {/* ══ FOOTER ═══════════════════════════════════════════════════════════ */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-12">
        <div className="container mx-auto px-6 flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md">
              <GraduationCap className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-lg text-slate-900 dark:text-white">Lingua Campus</span>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-500 dark:text-slate-400 mb-8">
            <a href="#practica-ia" className="hover:text-slate-900 dark:hover:text-white transition-colors">Práctica IA</a>
            <a href="#asistencia-qr" className="hover:text-slate-900 dark:hover:text-white transition-colors">Asistencia QR</a>
            <a href="#para-quien" className="hover:text-slate-900 dark:hover:text-white transition-colors">¿Para quién?</a>
            <a href="#finanzas" className="hover:text-slate-900 dark:hover:text-white transition-colors">Finanzas</a>
            <a href="#contacto" className="hover:text-slate-900 dark:hover:text-white transition-colors">Contacto</a>
            <Link href="/login" className="hover:text-slate-900 dark:hover:text-white transition-colors">Acceder</Link>
          </div>
          <p className="text-slate-500 text-sm">© {new Date().getFullYear()} Lingua Campus. Todos los derechos reservados.</p>
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-2 font-medium">
            Desarrollado y potenciado por{" "}
            <a
              href="https://origenmdp.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors font-semibold hover:underline"
            >
              Origen MdP - Costa Tech
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
