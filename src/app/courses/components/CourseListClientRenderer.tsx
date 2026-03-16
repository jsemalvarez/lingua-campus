"use client";

import { useState, useTransition } from "react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableCourseCard } from "./SortableCourseCard";
import { updateCourseSortOrderAction } from "../actions/sortOrder";
import { AlertCircle, Loader2, Search, X } from "lucide-react";

interface CourseListClientRendererProps {
    initialCourses: any[];
    userRole: string;
    DAYS_OF_WEEK: string[];
}

export function CourseListClientRenderer({ initialCourses, userRole, DAYS_OF_WEEK }: CourseListClientRendererProps) {
    const [courses, setCourses] = useState(initialCourses);
    const [searchQuery, setSearchQuery] = useState("");
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    // Filtrar cursos por el texto del buscador
    const filteredCourses = courses.filter(course => 
        course.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Una pequeña distancia para evitar arrastres accidentales al hacer clic
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = courses.findIndex((item) => item.id === active.id);
            const newIndex = courses.findIndex((item) => item.id === over.id);

            const newOrderedCourses = arrayMove(courses, oldIndex, newIndex);
            setCourses(newOrderedCourses);

            // Guardar el nuevo orden de forma persistente
            const sortedIds = newOrderedCourses.map(c => c.id);
            
            startTransition(async () => {
                const result = await updateCourseSortOrderAction(sortedIds);
                if (!result.success) {
                    setError("No se pudo guardar el nuevo orden. Intenta nuevamente.");
                    // Opcional: Revertir el orden si falla el guardado
                    // setCourses(courses);
                } else {
                    setError(null);
                }
            });
        }
    };

    return (
        <div className="space-y-4">
            {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 rounded-lg text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                    <AlertCircle size={16} /> {error}
                </div>
            )}

            {isPending && (
                <div className="fixed bottom-8 right-8 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium animate-in fade-in slide-in-from-bottom-4 z-50">
                    <Loader2 size={16} className="animate-spin" /> Guardando orden...
                </div>
            )}

            {/* ── Buscador ── */}
            <div className="relative group max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                </div>
                <input
                    type="text"
                    placeholder="Buscar curso por nombre..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-10 pr-10 py-2.5 bg-background/50 border border-border/60 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 hover:border-border group-focus-within:bg-background"
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery("")}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={courses.map(c => c.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="flex flex-col gap-5 w-full">
                        {filteredCourses.length === 0 ? (
                            <div className="text-center py-12 bg-muted/10 rounded-2xl border border-dashed border-border/40">
                                <Search className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
                                <p className="text-muted-foreground font-medium">No se encontraron cursos que coincidan con &quot;{searchQuery}&quot;</p>
                                <button 
                                    onClick={() => setSearchQuery("")}
                                    className="text-primary text-sm font-semibold mt-2 hover:underline"
                                >
                                    Limpiar búsqueda
                                </button>
                            </div>
                        ) : (
                            filteredCourses.map((course) => (
                                <SortableCourseCard 
                                    key={course.id} 
                                    course={course} 
                                    userRole={userRole}
                                    DAYS_OF_WEEK={DAYS_OF_WEEK}
                                />
                            ))
                        )}
                    </div>
                </SortableContext>
            </DndContext>
        </div>
    );
}
