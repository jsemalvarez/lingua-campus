export interface FilterOption {
    id: string;
    name: string;
}

export interface ScheduleFiltersProps {
    allCourses: FilterOption[];
    allTeachers: FilterOption[];
    allClassrooms: FilterOption[];
    userRole: string;
    currentFilters: {
        courseId?: string;
        teacherId?: string;
        classroomId?: string;
    };
}
