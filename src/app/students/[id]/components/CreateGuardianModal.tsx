"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { UserPlus, Loader2, KeyRound } from "lucide-react";
import { createGuardianAccount } from "../actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  studentId: string;
  guardianName: string;
  relation: string;
  existingEmail?: string;
  isFullWidth?: boolean;
}

export function CreateGuardianModal({ studentId, guardianName, relation, existingEmail, isFullWidth }: Props) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(existingEmail || "");
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    if (!email) {
      toast.error("Por favor ingresa un email");
      return;
    }

    setLoading(true);
    try {
      const res = await createGuardianAccount(studentId, guardianName, relation, email);
      if (res.success) {
        toast.success("¡Cuenta de tutor creada/vinculada con éxito!");
        toast.info("La contraseña inicial es: Lingua2026");
        setOpen(false);
      } else {
        toast.error(res.error || "Error al crear la cuenta");
      }
    } catch (err) {
      toast.error("Error de red o del servidor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={cn(
            "h-8 gap-2 text-xs border-primary/30 hover:border-primary hover:bg-primary/5 text-primary",
            isFullWidth && "w-full"
          )}
        >
          <UserPlus size={14} />
          Habilitar Acceso
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="text-primary" size={20} />
            Habilitar Acceso para Tutor
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Se creará un acceso para <strong>{guardianName}</strong> ({relation}). 
              Podrá ingresar con su email y ver los datos de este alumno.
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder="ejemplo@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="text-[11px] text-primary/80 font-medium uppercase tracking-tight mb-1">Nota Importante</p>
            <p className="text-xs text-muted-foreground">
              La contraseña provisional será <span className="font-mono font-bold text-primary">Lingua2026</span>.
              Si el usuario ya tiene cuenta de profesor o admin, se le añadirán los permisos de tutor a su misma cuenta.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={loading} className="gap-2">
            {loading && <Loader2 className="animate-spin" size={16} />}
            Crear Acceso
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
