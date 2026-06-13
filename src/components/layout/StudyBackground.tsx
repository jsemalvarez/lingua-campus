"use client";

import { Book, GraduationCap, Pencil, Globe, Lightbulb, Library, Edit3, Compass, Ruler, Calculator, Bookmark, Notebook, Backpack, Brain } from "lucide-react";
import { useEffect, useState } from "react";

export function StudyBackground() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none">
      {/* Subtle animated background study icons */}
      <div className="absolute inset-0 opacity-[0.09] dark:opacity-[0.10]">
        <Book className="absolute top-[10%] left-[5%] w-16 h-16 text-primary animate-float-slow" />
        <GraduationCap className="absolute top-[20%] right-[10%] w-32 h-32 text-purple-500 animate-float-x-delayed" />
        <Pencil className="absolute top-[55%] left-[15%] w-20 h-20 text-emerald-500 animate-float-slow-reverse" />
        <Globe className="absolute top-[65%] right-[5%] w-40 h-40 text-blue-500 animate-float-x-slow" />
        <Lightbulb className="absolute top-[35%] left-[45%] w-12 h-12 text-yellow-500 animate-float-delayed" />
        <Library className="absolute top-[80%] left-[35%] w-24 h-24 text-indigo-500 animate-float-x-slow-reverse" />
        <Edit3 className="absolute top-[5%] right-[35%] w-20 h-20 text-orange-500 animate-float-slow-reverse" />

        <Compass className="absolute top-[45%] right-[25%] w-16 h-16 text-teal-500 animate-float-x" />
        <Ruler className="absolute top-[75%] left-[5%] w-32 h-32 text-pink-500 animate-float-delayed" />
        <Calculator className="absolute top-[25%] left-[25%] w-24 h-24 text-red-500 animate-float-x-slow" />
        <Bookmark className="absolute top-[85%] right-[40%] w-12 h-12 text-sky-500 animate-float-slow-reverse" />
        <Notebook className="absolute top-[15%] right-[50%] w-20 h-20 text-lime-500 animate-float" />
        <Backpack className="absolute top-[50%] left-[5%] w-28 h-28 text-cyan-500 animate-float-x-delayed" />
        <Brain className="absolute top-[90%] right-[20%] w-16 h-16 text-fuchsia-500 animate-float-x-slow-reverse" />
      </div>
    </div>
  );
}
