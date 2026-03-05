import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Standard container for SaaS data visualization.
 * Supports different styles like 'elevated' or 'bordered'.
 */
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "glass" | "bordered";
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className, variant = "default", ...props }, ref) => {
        const variants = {
            default: "bg-card text-card-foreground shadow-xs border border-border",
            glass: "glass text-foreground shadow-lg backdrop-blur-xl",
            bordered: "bg-transparent border-2 border-dashed border-border text-foreground hover:border-primary/50 transition-colors",
        };

        return (
            <div
                ref={ref}
                className={cn("rounded-xl p-4 sm:p-6", variants[variant], className)}
                {...props}
            />
        );
    }
);
Card.displayName = "Card";

const CardHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("flex flex-col space-y-1.5 pb-4", className)} {...props} />
);
CardHeader.displayName = "CardHeader";

const CardTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className={cn("text-lg font-semibold leading-tight tracking-tight", className)} {...props} />
);
CardTitle.displayName = "CardTitle";

const CardContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("pt-0", className)} {...props} />
);
CardContent.displayName = "CardContent";

export { Card, CardHeader, CardTitle, CardContent };
