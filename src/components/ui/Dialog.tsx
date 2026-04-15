import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

/**
 * Custom Dialog component based on Tailwind CSS with State Management and Portals.
 */

interface DialogContextProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DialogContext = React.createContext<DialogContextProps | undefined>(undefined);

const Dialog = ({ 
  children, 
  open: controlledOpen, 
  onOpenChange 
}: { 
  children: React.ReactNode; 
  open?: boolean; 
  onOpenChange?: (open: boolean) => void 
}) => {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange !== undefined ? onOpenChange : setInternalOpen;

  return (
    <DialogContext.Provider value={{ open, setOpen }}>
      {children}
    </DialogContext.Provider>
  );
};

const DialogTrigger = ({ 
  children, 
  asChild,
}: { 
  children: React.ReactElement; 
  asChild?: boolean;
}) => {
  const context = React.useContext(DialogContext);
  if (!context) throw new Error("DialogTrigger must be used within a Dialog");

  return React.cloneElement(children as React.ReactElement<any>, {
    onClick: (e: any) => {
      (children as any).props.onClick?.(e);
      context.setOpen(true);
    }
  });
};

const DialogContent = ({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string 
}) => {
  const context = React.useContext(DialogContext);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!context || !context.open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="absolute inset-0 cursor-pointer" 
        onClick={() => context.setOpen(false)} 
      />
      <div className={cn("z-[101] w-full max-w-lg bg-card text-card-foreground p-6 rounded-xl border border-border shadow-2xl animate-in zoom-in-95 duration-200", className)}>
        {children}
      </div>
    </div>,
    document.body
  );
};

const DialogHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col space-y-1.5 text-center sm:text-left mb-4">
    {children}
  </div>
);

const DialogTitle = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <h2 className={cn("text-lg font-semibold leading-none tracking-tight", className)}>
    {children}
  </h2>
);

const DialogFooter = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6", className)}>
    {children}
  </div>
);

export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
};
