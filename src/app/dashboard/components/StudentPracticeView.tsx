"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { 
  Sparkles, 
  Gamepad2, 
  Mic2, 
  Headphones, 
  MessageSquare,
  Zap,
  Star
} from "lucide-react";

export function StudentPracticeView() {
  return (
    <main className="container mx-auto px-4 sm:px-6 py-20 animate-in mt-12 mb-24 max-w-5xl">
      
      <div className="text-center space-y-6 mb-20">
         <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20">
            <Sparkles size={14} /> Nueva Dimensión de Aprendizaje
         </div>
         <h1 className="text-5xl md:text-7xl font-black tracking-tighter italic uppercase leading-none">
            Aula de Práctica<br/> <span className="text-primary italic">Automática</span>
         </h1>
         <p className="text-muted-foreground text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
            Estamos construyendo un entorno interactivo donde podrás entrenar tus habilidades de Speaking y Listening con IA, juegos y desafíos semanales.
         </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {[
           { icon: Mic2, title: "Speaking Hub", desc: "Mejora tu pronunciación en tiempo real." },
           { icon: Headphones, title: "Listening Lab", desc: "Entrena tu oído con audios nativos." },
           { icon: MessageSquare, title: "AI Chatbot", desc: "Conversa con nuestra IA 24/7." },
           { icon: Gamepad2, title: "Daily Quest", desc: "Gana puntos resolviendo desafíos." }
         ].map((item, i) => (
           <Card key={i} className="p-8 rounded-[2.5rem] border-none shadow-xl bg-card hover:translate-y-[-8px] transition-all duration-500 group">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all shadow-lg shadow-primary/20">
                 <item.icon size={28} />
              </div>
              <h3 className="font-black text-lg mb-2">{item.title}</h3>
              <p className="text-xs text-muted-foreground font-medium">{item.desc}</p>
           </Card>
         ))}
      </div>

      <Card className="mt-20 p-12 rounded-[3.5rem] border-none shadow-2xl bg-slate-900 text-white relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-105 transition-transform duration-1000">
            <Zap size={300} className="text-primary" />
         </div>
         
         <div className="relative z-10 flex flex-col items-center text-center space-y-8">
            <div className="w-20 h-20 bg-white/10 rounded-[2rem] flex items-center justify-center backdrop-blur-md">
               <Star size={40} className="text-yellow-400 fill-yellow-400" />
            </div>
            <div className="max-w-xl">
               <h2 className="text-3xl font-black tracking-tight mb-4">Próximamente disponible</h2>
               <p className="text-white/50 font-medium leading-relaxed">
                  El Playground será tu espacio personal para sumar horas de práctica extra. Estamos ajustando los últimos detalles para que vivas una experiencia de inmersión total.
               </p>
            </div>
            <button className="px-8 py-4 bg-primary text-white font-black text-sm rounded-2xl shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all">
               ¡Avísame al Lanzamiento!
            </button>
         </div>
      </Card>

    </main>
  );
}
