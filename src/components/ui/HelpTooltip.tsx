import { HelpCircle, ExternalLink } from "lucide-react";
import Link from "next/link";

interface HelpTooltipProps {
    title: string;
    description: string;
    href?: string;
    linkText?: string;
}

export function HelpTooltip({ title, description, href, linkText = "Saber más" }: HelpTooltipProps) {
    return (
        <div className="group relative inline-flex items-center justify-center ml-1.5 align-middle">
            <HelpCircle size={16} className="text-muted-foreground hover:text-primary transition-colors cursor-help" />
            
            {/* Tooltip Content */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 w-64 p-3 bg-card text-card-foreground text-sm rounded-xl shadow-xl border border-border/60 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-50 translate-y-1 group-hover:translate-y-0">
                <h4 className="font-bold mb-1 text-primary text-[13px]">{title}</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed mb-2.5">
                    {description}
                </p>
                {href && (
                    <Link 
                        href={href} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors uppercase tracking-wider"
                    >
                        {linkText} <ExternalLink size={12} className="-mt-0.5" />
                    </Link>
                )}
                
                {/* Flecha inferior */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-[6px] border-x-transparent border-t-[6px] border-t-border/60">
                    <div className="absolute -top-[7px] -left-[5px] w-0 h-0 border-x-[5px] border-x-transparent border-t-[5px] border-t-card"></div>
                </div>
            </div>
        </div>
    );
}
