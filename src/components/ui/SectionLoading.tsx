"use client";

import { cn } from "@/lib/utils";

interface SectionLoadingProps {
  variant?: "table" | "cards" | "form" | "dashboard";
  rows?: number;
  className?: string;
}

export function SectionLoading({
  variant = "table",
  rows = 5,
  className,
}: SectionLoadingProps) {
  return (
    <div className={cn("w-full p-6 space-y-8 animate-pulse", className)}>
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted rounded-lg" />
          <div className="h-4 w-64 bg-muted/60 rounded-md" />
        </div>
        <div className="h-10 w-32 bg-muted rounded-xl" />
      </div>

      {variant === "table" && (
        <div className="border border-border/50 rounded-2xl overflow-hidden bg-card/30">
          <div className="h-12 bg-muted/30 border-b border-border/50" />
          <div className="p-4 space-y-4">
            {Array.from({ length: rows }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-muted/50 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 bg-muted/60 rounded-md" />
                  <div className="h-3 w-1/4 bg-muted/40 rounded-sm" />
                </div>
                <div className="h-8 w-20 bg-muted/30 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      )}

      {variant === "cards" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="p-6 border border-border/50 rounded-2xl bg-card/30 space-y-4">
              <div className="h-12 w-12 rounded-xl bg-muted/50" />
              <div className="space-y-2">
                <div className="h-5 w-2/3 bg-muted/60 rounded-md" />
                <div className="h-4 w-full bg-muted/40 rounded-sm" />
                <div className="h-4 w-4/5 bg-muted/40 rounded-sm" />
              </div>
              <div className="pt-4 flex justify-between">
                <div className="h-4 w-20 bg-muted/30 rounded-md" />
                <div className="h-4 w-16 bg-muted/30 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      )}

      {variant === "form" && (
        <div className="max-w-3xl space-y-8 p-8 border border-border/50 rounded-3xl bg-card/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-24 bg-muted/60 rounded-sm" />
                <div className="h-10 w-full bg-muted/40 rounded-xl" />
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <div className="h-4 w-24 bg-muted/60 rounded-sm" />
            <div className="h-32 w-full bg-muted/40 rounded-xl" />
          </div>
          <div className="flex justify-end pt-4">
            <div className="h-12 w-32 bg-muted rounded-xl" />
          </div>
        </div>
      )}

      {variant === "dashboard" && (
        <div className="space-y-8">
          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-card/30 border border-border/50 rounded-2xl p-4 space-y-2">
                <div className="h-4 w-20 bg-muted/60 rounded-sm" />
                <div className="h-8 w-16 bg-muted/80 rounded-md" />
              </div>
            ))}
          </div>
          
          {/* Main Content Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-80 bg-card/30 border border-border/50 rounded-3xl" />
              <div className="h-60 bg-card/30 border border-border/50 rounded-3xl" />
            </div>
            <div className="space-y-6">
              <div className="h-[500px] bg-card/30 border border-border/50 rounded-3xl" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
