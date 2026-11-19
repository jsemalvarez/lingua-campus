"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { setIssueStatusAction } from "./actions";

/** «Marcar resuelto» o «Reabrir», según cómo esté el problema. */
export function IssueStatusButton({ issueId, status }: { issueId: string; status: "OPEN" | "RESOLVED" }) {
    const [pending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const resolved = status === "RESOLVED";

    const toggle = () => {
        setError(null);
        startTransition(async () => {
            const result = await setIssueStatusAction(issueId, resolved ? "OPEN" : "RESOLVED");
            if (!result.success) setError(result.error ?? "No se pudo cambiar el estado del problema.");
        });
    };

    return (
        <div className="flex flex-col items-start sm:items-end gap-1.5 shrink-0">
            <Button onClick={toggle} disabled={pending} variant={resolved ? "outline" : "primary"} className="min-h-11 px-5 font-semibold">
                {pending ? "Guardando…" : resolved ? "Reabrir" : "Marcar resuelto"}
            </Button>
            {error && <p role="alert" className="text-xs text-red-600 dark:text-red-400">{error}</p>}
        </div>
    );
}
