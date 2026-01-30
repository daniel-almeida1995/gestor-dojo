import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Student } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface StudentContextType {
  students: Student[];
  loading: boolean;
  total: number;
  page: number;
  perPage: number;
  search: string;
  statusFilter: string;
  setPage: (page: number) => void;
  setSearch: (search: string) => void;
  setStatusFilter: (status: string) => void;
  addStudent: (student: Student) => Promise<void>;
  updateStudent: (id: string, updates: Partial<Student>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  refreshStudents: () => Promise<void>;
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

// Utility to map DB result (snake_case) to Frontend Model (camelCase)
const mapStudent = (s: any): Student => ({
  id: s.id,
  name: s.name,
  phone: s.phone,
  modality: s.modality,
  belt: s.belt,
  beltColor: s.belt_color,
  status: s.status,
  avatar: s.avatar,
  degrees: s.degrees,
  classesAttended: s.classes_attended,
  history: s.history || [],
  dueDay: s.due_day || 10,
  monthlyFee: s.monthly_fee !== undefined ? Number(s.monthly_fee) : 150,
  lastPaymentDate: s.last_payment_date
});

export const StudentProvider = ({ children }: { children?: React.ReactNode }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Pagination & Filters State
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');

  const { user } = useAuth();

  const fetchStudents = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      let query = supabase
        .from('students')
        .select('*', { count: 'exact' });

      // Apply Filters
      if (search) {
        query = query.ilike('name', `%${search}%`);
      }

      if (statusFilter !== 'todos') {
        if (statusFilter === 'payment_issue') {
          // 'payment_issue' is a derived status often, but if we save it in DB column 'status', we filter by it
          // If the logic is dynamic (e.g. late payment), we can't easily filter in SQL without a function or computed column
          // For now, assume we rely on the DB 'status' column or 'payment_issue' flag if it exists.
          // Given the current architecture, 'payment_issue' IS a value for status column in types.
          query = query.eq('status', 'payment_issue');
        } else if (statusFilter === 'active') {
          query = query.eq('status', 'active');
        } else if (statusFilter === 'inactive') {
          query = query.eq('status', 'inactive');
        }
      }

      // Apply Pagination
      const from = (page - 1) * perPage;
      const to = from + perPage - 1;

      const { data, count, error } = await query
        .order('name', { ascending: true })
        .range(from, to);

      if (error) throw error;

      setTotal(count || 0);

      // Use the helper function
      const mappedStudents: Student[] = (data || []).map(mapStudent);

      setStudents(mappedStudents);
    } catch (error: any) {
      console.error('Error fetching students:', error.message || error);
    } finally {
      setLoading(false);
    }
  }, [user, page, perPage, search, statusFilter]);

  useEffect(() => {
    if (user) {
      fetchStudents();
    } else {
      setStudents([]);
    }
  }, [fetchStudents, user]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const formatError = (error: any) => {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    if (error?.details) return error.details;
    try {
      return JSON.stringify(error);
    } catch {
      return 'Erro desconhecido';
    }
  };

  const addStudent = async (student: Student) => {
    if (!user) throw new Error('User not logged in');

    try {
      const { data, error } = await supabase.from('students').insert([{
        user_id: user.id,
        name: student.name,
        phone: student.phone,
        modality: student.modality,
        belt: student.belt,
        belt_color: student.beltColor,
        status: student.status,
        avatar: student.avatar,
        degrees: student.degrees,
        classes_attended: student.classesAttended,
        history: student.history,
        due_day: student.dueDay,
        monthly_fee: student.monthlyFee,
        last_payment_date: student.lastPaymentDate
      }])
        .select()
        .single();

      if (error) throw error;

      // Refresh to respect sort order/pagination
      await fetchStudents();

    } catch (error: any) {
      console.error('Error adding student:', error);
      alert(`Erro ao salvar aluno: ${formatError(error)}`);
      throw error;
    }
  };

  const updateStudent = async (id: string, updates: Partial<Student>) => {
    try {
      const dbUpdates: any = {};
      if (updates.name) dbUpdates.name = updates.name;
      if (updates.phone) dbUpdates.phone = updates.phone;
      if (updates.modality) dbUpdates.modality = updates.modality;
      if (updates.belt) dbUpdates.belt = updates.belt;
      if (updates.beltColor) dbUpdates.belt_color = updates.beltColor;
      if (updates.status) dbUpdates.status = updates.status;
      if (updates.avatar) dbUpdates.avatar = updates.avatar;
      if (updates.degrees !== undefined) dbUpdates.degrees = updates.degrees;
      if (updates.classesAttended !== undefined) dbUpdates.classes_attended = updates.classesAttended;
      if (updates.history) dbUpdates.history = updates.history;
      if (updates.dueDay !== undefined) dbUpdates.due_day = updates.dueDay;
      if (updates.monthlyFee !== undefined) dbUpdates.monthly_fee = updates.monthlyFee;
      if (updates.lastPaymentDate !== undefined) dbUpdates.last_payment_date = updates.lastPaymentDate;

      const { error } = await supabase
        .from('students')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;

      // Optimistic update for current page items
      setStudents(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
      // In a real app we might want to refetch if 'name' changed (sort order)
    } catch (error: any) {
      console.error('Error updating student:', error);
      alert(`Erro ao atualizar aluno: ${formatError(error)}`);
      throw error;
    }
  };

  const deleteStudent = async (id: string) => {
    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchStudents();
    } catch (error: any) {
      console.error('Error deleting student:', error);
      alert(`Erro ao excluir aluno: ${formatError(error)}`);
      throw error;
    }
  };

  return (
    <StudentContext.Provider value={{
      students,
      loading,
      total,
      page,
      perPage,
      search,
      statusFilter,
      setPage,
      setSearch,
      setStatusFilter,
      addStudent,
      updateStudent,
      deleteStudent,
      refreshStudents: fetchStudents
    }}>
      {children}
    </StudentContext.Provider>
  );
};

export const useStudents = () => {
  const context = useContext(StudentContext);
  if (!context) {
    throw new Error('useStudents must be used within a StudentProvider');
  }
  return context;
};