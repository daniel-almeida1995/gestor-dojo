import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { checkInStudents, getClassAttendance, ClassAttendance } from '../lib/attendance';

interface ClassWithCapacity {
    id: string;
    title: string;
    date: string;
    time: string;
    modality: string;
    instructor: string;
    capacity: { current: number; max: number };
}

interface AttendanceContextType {
    todayClasses: ClassWithCapacity[];
    loading: boolean;
    refreshTodayClasses: () => Promise<void>;
    checkInMany: (classId: string, studentIds: string[]) => Promise<{ success: boolean; error?: string }>;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export const AttendanceProvider = ({ children }: { children?: React.ReactNode }) => {
    const { user } = useAuth();
    const [todayClasses, setTodayClasses] = useState<ClassWithCapacity[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTodayClasses = useCallback(async () => {
        if (!user) return;

        try {
            setLoading(true);
            const today = new Date().toISOString().split('T')[0];

            const { data, error } = await supabase
                .from('classes')
                .select('*')
                .eq('user_id', user.id)
                .eq('date', today)
                .order('time', { ascending: true });

            if (error) throw error;

            // Para cada aula, buscar o contador real de presença
            const classesWithAttendance = await Promise.all(
                (data || []).map(async (classItem) => {
                    const { count } = await supabase
                        .from('attendance_records')
                        .select('*', { count: 'exact', head: true })
                        .eq('class_id', classItem.id);

                    return {
                        ...classItem,
                        capacity: {
                            current: count || 0,
                            max: classItem.capacity?.max || 20
                        }
                    };
                })
            );

            setTodayClasses(classesWithAttendance);
        } catch (error) {
            console.error('Error loading today classes:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Initial load
    useEffect(() => {
        if (user) {
            fetchTodayClasses();
        } else {
            setTodayClasses([]);
        }
    }, [user, fetchTodayClasses]);

    const checkInMany = async (classId: string, studentIds: string[]) => {
        const result = await checkInStudents(classId, studentIds);
        if (result.success) {
            // Refresh local state to update counters
            await fetchTodayClasses();
        }
        return result;
    };

    return (
        <AttendanceContext.Provider value={{
            todayClasses,
            loading,
            refreshTodayClasses: fetchTodayClasses,
            checkInMany
        }}>
            {children}
        </AttendanceContext.Provider>
    );
};

export const useAttendance = () => {
    const context = useContext(AttendanceContext);
    if (!context) {
        throw new Error('useAttendance must be used within an AttendanceProvider');
    }
    return context;
};
