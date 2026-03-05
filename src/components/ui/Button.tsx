import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Common variants and sizes for the reusable Button component.
 * This ensures consistency across the entire SaaS platform.
 */
export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "outline" | "ghost" | "link";
    size?: "sm" | "md" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "primary", size = "md", ...props }, ref) => {
        const baseStyles = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";

        const variants = {
            primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
            secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
            outline: "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
            ghost: "bg-transparent hover:bg-accent hover:text-accent-foreground",
            link: "text-primary underline-offset-4 hover:underline",
        };

        const sizes = {
            sm: "h-9 px-3 text-xs",
            md: "h-10 px-4 py-2",
            lg: "h-11 px-8",
            icon: "h-10 w-10",
        };

        return (
            <button
                ref={ref}
                className={cn(baseStyles, variants[variant], sizes[size], className)}
                {...props}
            />
        );
    }
);

Button.displayName = "Button";

export { Button };
