"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "sonner";
import { OfflineGlobalIndicator } from "@/components/OfflineGlobalIndicator";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <ThemeProvider>
                <OfflineGlobalIndicator />
                {children}
                <Toaster richColors position="bottom-right" />
            </ThemeProvider>
        </SessionProvider>
    );
}
