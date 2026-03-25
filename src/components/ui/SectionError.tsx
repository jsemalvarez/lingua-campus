"use client";

import { AlertTriangle, Home, RefreshCcw } from "lucide-react";
import { Button } from "./Button";
import Link from "next/link";

interface SectionErrorProps {
  title?: string;
  message?: string;
  error?: Error & { digest?: string };
  reset?: () => void;
  showHome?: boolean;
}

export function SectionError({
  title = "Algo salió mal",
  message = "Hubo un problema al cargar los datos. Por favor, intenta de nuevo.",
  reset,
  showHome = true,
}: SectionErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center animate-in fade-in duration-500">
      <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 mb-6">
        <AlertTriangle size={32} />
      </div>
      
      <h2 className="text-2xl font-bold text-foreground mb-2">
        {title}
      </h2>
      
      <p className="text-muted-foreground max-w-md mb-8">
        {message}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-4">
        {reset && (
          <Button 
            onClick={() => reset()}
            variant="primary"
            className="flex items-center gap-2"
          >
            <RefreshCcw size={18} />
            Intentar de nuevo
          </Button>
        )}
        
        {showHome && (
          <Link href="/dashboard">
            <Button variant="outline" className="flex items-center gap-2">
              <Home size={18} />
              Ir al Dashboard
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
