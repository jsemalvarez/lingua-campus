"use client";

import { useOnlineStatus } from "@/hooks/use-online-status";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { WifiOff, Wifi } from "lucide-react";

export function OfflineGlobalIndicator() {
  const isOnline = useOnlineStatus();
  const prevStatusRef = useRef<boolean>(true);

  useEffect(() => {
    // We only care about state transitions after the initial render
    if (typeof window !== 'undefined') {
      if (!isOnline && prevStatusRef.current) {
        // Just went offline
        toast.warning("Estás sin conexión a internet.", {
          description: "Algunas funciones pueden no estar disponibles.",
          icon: <WifiOff className="h-4 w-4 text-amber-500" />,
          duration: 10000, 
        });
      } else if (isOnline && !prevStatusRef.current) {
        // Just came back online
        toast.success("Conexión restaurada.", {
          description: "Vuelves a tener acceso a internet.",
          icon: <Wifi className="h-4 w-4 text-green-500" />,
          duration: 4000,
        });
      }
      prevStatusRef.current = isOnline;
    }
  }, [isOnline]);

  return null;
}
