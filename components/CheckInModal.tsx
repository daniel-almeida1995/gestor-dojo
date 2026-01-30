import React, { useState, useEffect } from 'react';
import { X, Search, Check, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { checkInStudents, hasCheckedIn } from '../lib/attendance';

interface Student {
    id: string;
    name: string;
    avatar?: string;
    belt: string;
    belt_color: string;
    status: string;
}

interface CheckInModalProps {
    classItem: any;
    attendanceData: any;
    onClose: () => void;
    onComplete: () => void;
}

export const CheckInModal: React.FC<CheckInModalProps> = ({
    classItem,
    attendanceData,
    onClose,
    onComplete
}) => {
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadStudents();
    }, []);

    const loadStudents = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('students')
                .select('*')
                .eq('user_id', user.id)
                .eq('status', 'active')
                .order('name', { ascending: true });

            if (error) throw error;

            setStudents(data || []);

            // Pré-selecionar alunos que já fizeram check-in
            if (attendanceData?.records) {
                const checkedInIds = attendanceData.records.map((r: any) => r.student_id);
                setSelectedStudents(new Set(checkedInIds));
            }
        } catch (error) {
            console.error('Error loading students:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleStudent = (studentId: string) => {
        const newSelected = new Set(selectedStudents);
        if (newSelected.has(studentId)) {
            newSelected.delete(studentId);
        } else {
            newSelected.add(studentId);
        }
        setSelectedStudents(newSelected);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const studentIds = Array.from(selectedStudents) as string[];
            const result = await checkInStudents(classItem.id, studentIds);

            if (result.success) {
                toast.success('Presença registrada com sucesso!');
                onComplete();
            } else {
                toast.error('Erro ao salvar presença: ' + result.error);
            }
        } catch (error) {
            console.error('Error saving attendance:', error);
            toast.error('Erro ao salvar presença');
        } finally {
            setSaving(false);
        }
    };

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-3xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-bold text-gray-900">Registrar Presença</h3>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                        <span className="font-medium">{classItem.title}</span>
                        <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                        <span>{classItem.time}</span>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar aluno..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary/20"
                        />
                    </div>

                    {/* Counter */}
                    <div className="mt-3 flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                            {filteredStudents.length} alunos
                        </span>
                        <span className="font-bold text-secondary">
                            {selectedStudents.size} selecionados
                        </span>
                    </div>
                </div>

                {/* Students Grid */}
                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary mx-auto"></div>
                            <p className="text-sm text-gray-500 mt-2">Carregando alunos...</p>
                        </div>
                    ) : filteredStudents.length === 0 ? (
                        <div className="text-center py-12">
                            <Users size={48} className="mx-auto text-gray-300 mb-3" />
                            <p className="text-gray-500">Nenhum aluno encontrado</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {filteredStudents.map((student) => {
                                const isSelected = selectedStudents.has(student.id);
                                return (
                                    <button
                                        key={student.id}
                                        onClick={() => toggleStudent(student.id)}
                                        className={`p-3 rounded-xl border-2 transition-all ${isSelected
                                            ? 'border-secondary bg-secondary/5'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <div className="flex flex-col items-center gap-2">
                                            {/* Avatar */}
                                            <div className="relative">
                                                {student.avatar ? (
                                                    <img
                                                        src={student.avatar}
                                                        alt={student.name}
                                                        className="w-16 h-16 rounded-full object-cover bg-gray-200"
                                                    />
                                                ) : (
                                                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-xl">
                                                        {student.name.charAt(0).toUpperCase()}
                                                    </div>
                                                )}

                                                {/* Belt indicator */}
                                                <div
                                                    className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white"
                                                    style={{ backgroundColor: student.belt_color }}
                                                ></div>

                                                {/* Check mark */}
                                                {isSelected && (
                                                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-secondary rounded-full flex items-center justify-center">
                                                        <Check size={14} className="text-white" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Name */}
                                            <div className="text-center">
                                                <p className="text-sm font-bold text-gray-900 truncate w-full">
                                                    {student.name}
                                                </p>
                                                <p className="text-xs text-gray-500">{student.belt}</p>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200">
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving || selectedStudents.size === 0}
                            className="flex-1 py-3 bg-secondary text-white rounded-xl font-bold hover:bg-secondary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Salvando...
                                </>
                            ) : (
                                <>
                                    <Check size={18} />
                                    Salvar ({selectedStudents.size})
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
