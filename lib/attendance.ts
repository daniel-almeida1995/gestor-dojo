import { supabase } from './supabase';
import { Student } from '../types';

export interface AttendanceRecord {
    id: string;
    user_id: string;
    student_id: string;
    class_id: string;
    checked_in_at: string;
    checked_out_at?: string;
    notes?: string;
    created_at: string;
}

export interface AttendanceStats {
    total_classes: number;
    attendance_percentage: number;
    present_count: number;
    absent_count: number;
}

export interface ClassAttendance {
    class_id: string;
    total_students: number;
    present_students: number;
    attendance_percentage: number;
    records: AttendanceRecord[];
}

/**
 * Registra presença de múltiplos alunos em uma aula
 */
export const checkInStudents = async (
    classId: string,
    studentIds: string[]
): Promise<{ success: boolean; error?: string }> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        // 1. Buscar registros existentes para esta aula
        const { data: existingRecords, error: fetchError } = await supabase
            .from('attendance_records')
            .select('student_id')
            .eq('class_id', classId);

        if (fetchError) throw fetchError;

        const existingStudentIds = existingRecords?.map(r => r.student_id) || [];

        // 2. Calcular diferenças
        const toAdd = studentIds.filter(id => !existingStudentIds.includes(id));
        const toRemove = existingStudentIds.filter(id => !studentIds.includes(id));

        // 3. Adicionar novos
        if (toAdd.length > 0) {
            const records = toAdd.map(studentId => ({
                user_id: user.id,
                student_id: studentId,
                class_id: classId,
                checked_in_at: new Date().toISOString()
            }));

            const { error: insertError } = await supabase
                .from('attendance_records')
                .insert(records);

            if (insertError) throw insertError;
        }

        // 4. Remover desmarcados
        if (toRemove.length > 0) {
            const { error: deleteError } = await supabase
                .from('attendance_records')
                .delete()
                .eq('class_id', classId)
                .in('student_id', toRemove);

            if (deleteError) throw deleteError;
        }

        return { success: true };
    } catch (error: any) {
        console.error('Error checking in students:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Registra check-out de um aluno
 */
export const checkOutStudent = async (
    recordId: string
): Promise<{ success: boolean; error?: string }> => {
    try {
        const { error } = await supabase
            .from('attendance_records')
            .update({ checked_out_at: new Date().toISOString() })
            .eq('id', recordId);

        if (error) throw error;

        return { success: true };
    } catch (error: any) {
        console.error('Error checking out student:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Obtém registros de presença de uma aula específica
 */
export const getClassAttendance = async (
    classId: string
): Promise<ClassAttendance | null> => {
    try {
        const { data: records, error } = await supabase
            .from('attendance_records')
            .select(`
        *,
        student:students(id, name, avatar, belt, belt_color)
      `)
            .eq('class_id', classId)
            .order('checked_in_at', { ascending: false });

        if (error) throw error;

        // Buscar total de alunos ativos
        const { count: totalStudents } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active');

        const presentStudents = records?.length || 0;
        const total = totalStudents || 0;

        return {
            class_id: classId,
            total_students: total,
            present_students: presentStudents,
            attendance_percentage: total > 0 ? Math.round((presentStudents / total) * 100) : 0,
            records: records || []
        };
    } catch (error) {
        console.error('Error getting class attendance:', error);
        return null;
    }
};

/**
 * Obtém histórico de presença de um aluno em um período
 */
export const getStudentAttendanceHistory = async (
    studentId: string,
    startDate: Date,
    endDate: Date
): Promise<AttendanceRecord[]> => {
    try {
        const { data, error } = await supabase
            .from('attendance_records')
            .select(`
        *,
        class:classes(id, title, date, time, modality)
      `)
            .eq('student_id', studentId)
            .gte('checked_in_at', startDate.toISOString())
            .lte('checked_in_at', endDate.toISOString())
            .order('checked_in_at', { ascending: false });

        if (error) throw error;

        return data || [];
    } catch (error) {
        console.error('Error getting student attendance history:', error);
        return [];
    }
};

/**
 * Obtém estatísticas de presença de um aluno
 */
export const getStudentAttendanceStats = async (
    studentId: string,
    month: number,
    year: number
): Promise<AttendanceStats> => {
    try {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        // Buscar registros de presença
        const { data: attendanceRecords, error: attendanceError } = await supabase
            .from('attendance_records')
            .select('*')
            .eq('student_id', studentId)
            .gte('checked_in_at', startDate.toISOString())
            .lte('checked_in_at', endDate.toISOString());

        if (attendanceError) throw attendanceError;

        // Buscar total de aulas no período
        const { data: classes, error: classesError } = await supabase
            .from('classes')
            .select('*')
            .gte('date', startDate.toISOString().split('T')[0])
            .lte('date', endDate.toISOString().split('T')[0]);

        if (classesError) throw classesError;

        const presentCount = attendanceRecords?.length || 0;
        const totalClasses = classes?.length || 0;
        const absentCount = Math.max(0, totalClasses - presentCount);
        const percentage = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0;

        return {
            total_classes: totalClasses,
            attendance_percentage: percentage,
            present_count: presentCount,
            absent_count: absentCount
        };
    } catch (error) {
        console.error('Error getting student attendance stats:', error);
        return {
            total_classes: 0,
            attendance_percentage: 0,
            present_count: 0,
            absent_count: 0
        };
    }
};

/**
 * Obtém alunos com baixa frequência
 */
export const getLowAttendanceStudents = async (
    threshold: number = 50,
    month: number,
    year: number
): Promise<Array<{ student: Student; stats: AttendanceStats }>> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        // Buscar todos os alunos ativos
        const { data: students, error } = await supabase
            .from('students')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'active');

        if (error) throw error;

        const results = [];

        for (const student of students || []) {
            const stats = await getStudentAttendanceStats(student.id, month, year);
            if (stats.attendance_percentage < threshold) {
                results.push({ student, stats });
            }
        }

        return results.sort((a, b) => a.stats.attendance_percentage - b.stats.attendance_percentage);
    } catch (error) {
        console.error('Error getting low attendance students:', error);
        return [];
    }
};

/**
 * Verifica se um aluno já fez check-in em uma aula
 */
export const hasCheckedIn = async (
    classId: string,
    studentId: string
): Promise<boolean> => {
    try {
        const { data, error } = await supabase
            .from('attendance_records')
            .select('id')
            .eq('class_id', classId)
            .eq('student_id', studentId)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found

        return !!data;
    } catch (error) {
        console.error('Error checking if student checked in:', error);
        return false;
    }
};
