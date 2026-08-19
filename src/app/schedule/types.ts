export interface FilterOption {
    id: string;
    name: string;
}

export interface ScheduleFiltersProps {
    allCourses: FilterOption[];
    allTeachers: FilterOption[];
    allClassrooms: FilterOption[];
    userRole: string;
    /** El docente dicta algún nivel, así que puede tener pares (FEAT-07). */
    canSeePeers?: boolean;
    /** Si hoy está viendo las clases de sus pares. */
    showPeers?: boolean;
    currentFilters: {
        courseId?: string;
        teacherId?: string;
        classroomId?: string;
    };
}
