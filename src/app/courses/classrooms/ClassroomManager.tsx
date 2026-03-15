"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Plus, Edit2, Trash2, Users, Save, X } from "lucide-react";
import { createClassroomAction, updateClassroomAction, deleteClassroomAction } from "./actions";

interface Classroom {
    id: string;
    name: string;
    capacity: number | null;
}

export function ClassroomManager({ initialClassrooms }: { initialClassrooms: Classroom[] }) {
    const [classrooms, setClassrooms] = React.useState<Classroom[]>(initialClassrooms);
    const [isAdding, setIsAdding] = React.useState(false);
    const [editingId, setEditingId] = React.useState<string | null>(null);
    const [formData, setFormData] = React.useState({ name: "", capacity: "" });
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        const result = await createClassroomAction({
            name: formData.name,
            capacity: formData.capacity ? parseInt(formData.capacity) : undefined
        });

        if (result.success) {
            window.location.reload(); // Simple refresh for now to update Server Side props if needed, but we can also update locally
        } else {
            setError(result.error || "Error al crear el aula");
            setIsLoading(false);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingId) return;
        setIsLoading(true);
        setError(null);
        const result = await updateClassroomAction(editingId, {
            name: formData.name,
            capacity: formData.capacity ? parseInt(formData.capacity) : undefined
        });

        if (result.success) {
            window.location.reload();
        } else {
            setError(result.error || "Error al actualizar el aula");
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de que deseas eliminar esta aula?")) return;
        setIsLoading(true);
        const result = await deleteClassroomAction(id);
        if (result.success) {
            window.location.reload();
        } else {
            alert(result.error);
            setIsLoading(false);
        }
    };

    const startEdit = (classroom: Classroom) => {
        setEditingId(classroom.id);
        setFormData({ name: classroom.name, capacity: classroom.capacity?.toString() || "" });
        setIsAdding(false);
    };

    const cancel = () => {
        setIsAdding(false);
        setEditingId(null);
        setFormData({ name: "", capacity: "" });
        setError(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Listado de Aulas</h2>
                {!isAdding && !editingId && (
                    <Button onClick={() => setIsAdding(true)} className="premium-gradient">
                        <Plus className="mr-2 h-4 w-4" /> Nueva Aula
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
                        <h3 className="font-bold">{editingId ? "Editar Aula" : "Nueva Aula"}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Nombre del Aula</label>
                                <input
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ej: Aula 101"
                                    className="w-full px-4 py-2 rounded-lg border bg-background"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Capacidad (Opcional)</label>
                                <input
                                    type="number"
                                    value={formData.capacity}
                                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                                    placeholder="Ej: 30"
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
                {classrooms.length === 0 ? (
                    <div className="col-span-full text-center p-12 border-2 border-dashed rounded-xl text-muted-foreground">
                        No hay aulas registradas.
                    </div>
                ) : (
                    classrooms.map((classroom) => (
                        <Card key={classroom.id} className="p-5 flex justify-between items-center hover:border-primary/40 transition-colors">
                            <div>
                                <h3 className="font-bold text-lg">{classroom.name}</h3>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                    <Users size={14} />
                                    Capacidad: {classroom.capacity || "No definida"}
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <Button variant="ghost" size="icon" onClick={() => startEdit(classroom)} className="h-8 w-8 rounded-full hover:text-primary">
                                    <Edit2 size={16} />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(classroom.id)} className="h-8 w-8 rounded-full hover:text-destructive text-muted-foreground">
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
