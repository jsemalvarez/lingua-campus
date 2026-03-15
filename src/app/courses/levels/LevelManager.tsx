"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Plus, Edit2, Trash2, Layers } from "lucide-react";
import { createLevelAction, updateLevelAction, deleteLevelAction } from "./actions";

interface Level {
    id: string;
    name: string;
}

export function LevelManager({ initialLevels }: { initialLevels: Level[] }) {
    const [levels, setLevels] = React.useState<Level[]>(initialLevels);
    const [isAdding, setIsAdding] = React.useState(false);
    const [editingId, setEditingId] = React.useState<string | null>(null);
    const [formData, setFormData] = React.useState({ name: "" });
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        const result = await createLevelAction({ name: formData.name });

        if (result.success) {
            window.location.reload();
        } else {
            setError(result.error || "Error al crear el nivel");
            setIsLoading(false);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingId) return;
        setIsLoading(true);
        setError(null);
        const result = await updateLevelAction(editingId, { name: formData.name });

        if (result.success) {
            window.location.reload();
        } else {
            setError(result.error || "Error al actualizar el nivel");
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de que deseas eliminar este nivel?")) return;
        setIsLoading(true);
        const result = await deleteLevelAction(id);
        if (result.success) {
            window.location.reload();
        } else {
            alert(result.error);
            setIsLoading(false);
        }
    };

    const startEdit = (level: Level) => {
        setEditingId(level.id);
        setFormData({ name: level.name });
        setIsAdding(false);
    };

    const cancel = () => {
        setIsAdding(false);
        setEditingId(null);
        setFormData({ name: "" });
        setError(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Listado de Niveles</h2>
                {!isAdding && !editingId && (
                    <Button onClick={() => setIsAdding(true)} className="premium-gradient">
                        <Plus className="mr-2 h-4 w-4" /> Nuevo Nivel
                    </Button>
                )}
            </div>

            {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-lg">
                    {error}
                </div>
            )}

            {(isAdding || editingId) && (
                <Card className="p-6 border-primary/20 bg-primary/5">
                    <form onSubmit={editingId ? handleUpdate : handleAdd} className="space-y-4">
                        <h3 className="font-bold">{editingId ? "Editar Nivel" : "Nuevo Nivel"}</h3>
                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Nombre del Nivel</label>
                                <input
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ name: e.target.value })}
                                    placeholder="Ej: Principiante A1"
                                    className="w-full px-4 py-2 rounded-lg border bg-background"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="ghost" onClick={cancel} disabled={isLoading}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isLoading} className="premium-gradient">
                                {isLoading ? "Guardando..." : (editingId ? "Actualizar" : "Crear")}
                            </Button>
                        </div>
                    </form>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {levels.length === 0 ? (
                    <div className="col-span-full text-center p-12 border-2 border-dashed rounded-xl text-muted-foreground">
                        No hay niveles creados.
                    </div>
                ) : (
                    levels.map((level) => (
                        <Card key={level.id} className="p-5 flex justify-between items-center hover:border-primary/40 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 flex border rounded-xl border-primary/20 bg-primary/5 items-center justify-center">
                                    <Layers className="text-primary h-5 w-5" />
                                </div>
                                <h3 className="font-bold text-lg">{level.name}</h3>
                            </div>
                            <div className="flex gap-1">
                                <Button variant="ghost" size="icon" onClick={() => startEdit(level)} className="h-8 w-8 rounded-full hover:text-primary">
                                    <Edit2 size={16} />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(level.id)} className="h-8 w-8 rounded-full hover:text-destructive text-muted-foreground">
                                    <Trash2 size={16} />
                                </Button>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
