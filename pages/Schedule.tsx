import React, { useState, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, Check, MapPin, Clock, Users, Plus, ChevronRight, X, Trash2, AlignLeft, RefreshCw, Save, Edit3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

// Types for our Schedule
interface ScheduleClass {
  id: string;
  title: string;
  time: string;
  endTime: string;
  ampm: 'AM' | 'PM';
  instructor: string;
  location: string;
  status: 'completed' | 'active' | 'upcoming' | 'waitlist';
  modality: 'Jiu-Jitsu' | 'Judô';
  capacity?: { current: number; max: number };
  dateOffset?: number; // Kept for logic compatibility but derived
  date: string; // YYYY-MM-DD
  observations?: string;
}

export const Schedule = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filter, setFilter] = useState<'Todos' | 'Jiu-Jitsu' | 'Judô'>('Todos');

  // Data State
  const [classes, setClasses] = useState<ScheduleClass[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Modal Form State
  const [isNewClassModalOpen, setIsNewClassModalOpen] = useState(false);
  const [newClassTitle, setNewClassTitle] = useState('');
  const [newClassModality, setNewClassModality] = useState<'Jiu-Jitsu' | 'Judô'>('Jiu-Jitsu');
  const [newClassStartTime, setNewClassStartTime] = useState('19:00');
  const [newClassEndTime, setNewClassEndTime] = useState('20:30');
  const [newClassObservations, setNewClassObservations] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);

  // Detail Modal State
  const [selectedClass, setSelectedClass] = useState<ScheduleClass | null>(null);
  const [editingObservations, setEditingObservations] = useState('');
  const [isUpdatingObs, setIsUpdatingObs] = useState(false);

  // Update editing state when selected class changes
  useEffect(() => {
    if (selectedClass) {
      setEditingObservations(selectedClass.observations || '');
    }
  }, [selectedClass]);

  // Generate next 60 days to cover current and next month
  const calendarDays = useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 60; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      days.push(d);
    }
    return days;
  }, []);

  const weekDayNames = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  // Utility to format date as YYYY-MM-DD for DB
  const formatDateForDB = (date: Date) => {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  };

  const fetchClasses = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Fetch classes for the 60 day window
      const today = new Date();
      const endWindow = new Date();
      endWindow.setDate(today.getDate() + 60);

      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .gte('date', formatDateForDB(today))
        .lte('date', formatDateForDB(endWindow))
        .order('time', { ascending: true });

      if (error) throw error;

      const mappedClasses: ScheduleClass[] = (data || []).map(c => {
        const hour = parseInt(c.time.split(':')[0]);
        return {
          id: c.id,
          title: c.title,
          time: c.time,
          endTime: c.end_time,
          ampm: hour >= 12 ? 'PM' : 'AM',
          instructor: c.instructor,
          location: c.location,
          status: c.status,
          modality: c.modality,
          date: c.date,
          capacity: c.capacity,
          observations: c.observations,
          dateOffset: 0 // Placeholder, we check actual dates in render
        };
      });

      setClasses(mappedClasses);
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, [user]);

  // Check if two dates are the same day (ignoring time)
  const isSameDay = (d1: Date, dateString: string) => {
    return formatDateForDB(d1) === dateString;
  };

  // Filter Logic
  const filteredClasses = useMemo(() => {
    const selectedDateString = formatDateForDB(selectedDate);

    return classes.filter(c => {
      const matchesDate = c.date === selectedDateString;
      const matchesFilter = filter === 'Todos' || c.modality === filter;
      return matchesDate && matchesFilter;
    }).sort((a, b) => a.time.localeCompare(b.time));
  }, [selectedDate, filter, classes]);

  const hasClassesOnDate = (date: Date) => {
    const dateString = formatDateForDB(date);
    return classes.some(c => {
      const matchesDate = c.date === dateString;
      const matchesFilter = filter === 'Todos' || c.modality === filter;
      return matchesDate && matchesFilter;
    });
  };

  const handleDateSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const [y, m, d] = e.target.value.split('-').map(Number);
      setSelectedDate(new Date(y, m - 1, d));
    }
  };



  // ... (keep existing imports and state)

  const handleEditClass = () => {
    if (!selectedClass) return;
    setNewClassTitle(selectedClass.title);
    setNewClassModality(selectedClass.modality);
    setNewClassStartTime(selectedClass.time);
    setNewClassEndTime(selectedClass.endTime);
    setNewClassObservations(selectedClass.observations || '');
    setEditingClassId(selectedClass.id);
    setSelectedClass(null); // Close details
    setIsNewClassModalOpen(true); // Open form
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassTitle.trim() || !user) return;

    setIsSaving(true);
    const dateString = formatDateForDB(selectedDate);

    try {
      if (editingClassId) {
        // UPDATE
        const { error } = await supabase
          .from('classes')
          .update({
            title: newClassTitle,
            time: newClassStartTime,
            end_time: newClassEndTime,
            modality: newClassModality,
            observations: newClassObservations
          })
          .eq('id', editingClassId);

        if (error) throw error;
      } else {
        // INSERT
        const { error } = await supabase.from('classes').insert([{
          user_id: user.id,
          title: newClassTitle,
          date: dateString,
          time: newClassStartTime,
          end_time: newClassEndTime,
          modality: newClassModality,
          instructor: 'Mestre Rafael',
          location: 'Tatame Principal',
          status: 'upcoming',
          capacity: { current: 0, max: 20 },
          observations: newClassObservations
        }]);

        if (error) throw error;
      }

      await fetchClasses();

      // Reset
      setNewClassTitle('');
      setNewClassStartTime('19:00');
      setNewClassEndTime('20:30');
      setNewClassObservations('');
      setEditingClassId(null);
      setIsNewClassModalOpen(false);

    } catch (error) {
      console.error('Error saving class:', error);
      alert('Erro ao salvar aula.');
    } finally {
      setIsSaving(false);
    }
  };

  // ... (Keep existing helpers)

  // In the Details Modal logic:
  // Add Edit Button

  // In the Form Modal logic:
  // Update Title: {editingClassId ? 'Editar Aula' : 'Agendar Nova Aula'}
  // Update Button: {isSaving ? 'Salvando...' : (editingClassId ? 'Salvar Alterações' : 'Agendar')}


  const handleUpdateObservations = async () => {
    if (!selectedClass) return;

    setIsUpdatingObs(true);
    try {
      const { error } = await supabase
        .from('classes')
        .update({ observations: editingObservations })
        .eq('id', selectedClass.id);

      if (error) throw error;

      // Update local state
      const updatedClass = { ...selectedClass, observations: editingObservations };
      setSelectedClass(updatedClass);
      setClasses(prev => prev.map(c => c.id === selectedClass.id ? updatedClass : c));

    } catch (error) {
      console.error('Error updating observations:', error);
      alert('Erro ao atualizar observações');
    } finally {
      setIsUpdatingObs(false);
    }
  };

  const handleCancelClass = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Tem certeza que deseja cancelar esta aula?')) {
      try {
        const { error } = await supabase
          .from('classes')
          .delete()
          .eq('id', id);

        if (error) throw error;

        setClasses(prev => prev.filter(c => c.id !== id));
        if (selectedClass?.id === id) setSelectedClass(null);
      } catch (error) {
        console.error('Error deleting class:', error);
      }
    }
  };

  const handleStartClass = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('/attendance');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-24 relative">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md transition-all duration-300 shadow-sm">
        <div className="px-5 pt-6 pb-2 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-500 mb-0.5 capitalize">
              {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
            </p>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Agenda de Aulas</h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchClasses}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              disabled={isLoading}
            >
              <RefreshCw size={20} className={`text-gray-900 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <div className="relative group">
              <input
                type="date"
                className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
                onChange={handleDateSelect}
              />
              <div className="relative p-2 rounded-full group-hover:bg-gray-100 group-active:bg-gray-200 transition-colors">
                <CalendarIcon size={24} className="text-gray-900" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </div>
            </div>
          </div>
        </div>

        {/* Date Selector */}
        <div className="px-5 py-4 w-full overflow-x-auto">
          <div className="flex items-center gap-3">
            {calendarDays.map((date, index) => {
              const isSelected = formatDateForDB(date) === formatDateForDB(selectedDate);
              const hasActivity = hasClassesOnDate(date);

              return (
                <button
                  key={index}
                  onClick={() => setSelectedDate(date)}
                  className={`flex flex-col items-center justify-center min-w-[52px] h-[72px] rounded-2xl border transition-all duration-200 ${isSelected
                    ? 'bg-[#1f8aad] border-[#1f8aad] text-white shadow-lg shadow-[#1f8aad]/30 scale-105'
                    : 'bg-transparent border-transparent text-gray-400 hover:bg-gray-100'
                    }`}
                >
                  <span className={`text-xs font-bold mb-1 ${isSelected ? 'opacity-80' : ''}`}>
                    {weekDayNames[date.getDay()]}
                  </span>
                  <span className="text-lg font-bold">{date.getDate()}</span>
                  <div className={`w-1 h-1 rounded-full mt-1 transition-colors ${isSelected ? 'bg-white' : (hasActivity ? 'bg-[#1f8aad]' : 'bg-transparent')
                    }`}></div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filters */}
        <div className="px-5 pb-4 w-full overflow-x-auto no-scrollbar border-b border-gray-100">
          <div className="flex items-center gap-3">
            {['Todos', 'Jiu-Jitsu', 'Judô'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-5 py-2 rounded-full text-sm font-bold shadow-sm whitespace-nowrap transition-colors ${filter === f
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Timeline */}
      <main className="px-5 pt-6 flex flex-col gap-0 min-h-[300px]">

        {isLoading && filteredClasses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-[#1f8aad] border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-400 font-medium">Carregando aulas...</p>
          </div>
        ) : filteredClasses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center opacity-60">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4 text-gray-400">
              <CalendarIcon size={32} />
            </div>
            <p className="text-gray-900 font-bold text-lg">Sem aulas</p>
            <p className="text-gray-500 text-sm max-w-[200px]">Não há aulas agendadas para esta data ou filtro.</p>
          </div>
        ) : (
          filteredClasses.map((session, idx) => {
            const isLast = idx === filteredClasses.length - 1;

            return (
              <div key={session.id} className="relative group">
                {/* Timeline Line */}
                {!isLast && (
                  <div className={`absolute left-[26px] top-12 bottom-[-12px] w-0.5 ${session.status === 'completed' ? 'border-l-2 border-dashed border-gray-200' : 'bg-gray-200'
                    }`}></div>
                )}

                <div className="flex gap-4 items-stretch pb-6">
                  {/* Time Column */}
                  <div className={`flex flex-col items-center min-w-[56px] pt-2 ${session.status === 'completed' ? 'opacity-50' : ''
                    }`}>
                    <span className={`text-base font-bold ${session.status === 'active' ? 'text-[#1f8aad]' : 'text-gray-900'}`}>
                      {session.time}
                    </span>
                    <span className="text-[10px] font-bold text-gray-500">{session.ampm}</span>

                    {/* Status Dot */}
                    <div className={`mt-3 w-3 h-3 rounded-full z-10 border-2 ${session.status === 'active' ? 'bg-[#1f8aad] border-[#1f8aad] shadow-[0_0_0_4px_rgba(31,138,173,0.2)] animate-pulse' :
                      session.status === 'waitlist' ? 'bg-white border-orange-400' :
                        session.status === 'completed' ? 'bg-gray-100 border-gray-300' :
                          'bg-gray-300 border-gray-300'
                      }`}></div>
                  </div>

                  {/* Card Content - Clickable for details */}
                  <div
                    onClick={() => setSelectedClass(session)}
                    className={`flex-1 rounded-2xl border shadow-sm overflow-hidden transition-all cursor-pointer active:scale-[0.98] ${session.status === 'active' ? 'bg-white border-blue-100 shadow-md ring-1 ring-blue-500/10' :
                      session.status === 'waitlist' ? 'bg-white border-orange-100 opacity-90' :
                        session.status === 'completed' ? 'bg-gray-50 border-gray-100' :
                          'bg-white border-gray-100'
                      }`}>
                    <div className="flex h-full">
                      {/* Left Border Indicator */}
                      <div className={`w-1.5 h-auto ${session.status === 'active' ? 'bg-[#1f8aad]' :
                        session.status === 'waitlist' ? 'bg-orange-500' :
                          session.status === 'completed' ? 'bg-gray-300' :
                            'bg-slate-800'
                        }`}></div>

                      <div className="flex-1 p-4 flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs font-bold uppercase tracking-wide ${session.status === 'active' ? 'text-[#1f8aad]' :
                                session.status === 'waitlist' ? 'text-orange-500' :
                                  'text-gray-500'
                                }`}>
                                {session.modality}
                              </span>

                              {session.status === 'waitlist' && (
                                <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                                  Lista de Espera
                                </span>
                              )}

                              {session.status === 'completed' && (
                                <span className="text-[10px] font-bold text-gray-400 px-1.5 py-0.5 bg-gray-100 rounded-md">
                                  Concluído
                                </span>
                              )}
                            </div>

                            <h3 className={`text-base font-bold text-gray-900 leading-tight ${session.status === 'completed' ? 'line-through text-gray-500' : ''
                              }`}>
                              {session.title}
                            </h3>

                            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Users size={12} />
                                {session.instructor}
                              </span>
                              <span>•</span>
                              <span>{session.location}</span>
                            </div>
                          </div>
                        </div>

                        {/* Actions / Capacity */}
                        {session.status !== 'completed' && (
                          <div className="mt-2 pt-2 border-t border-gray-50 flex items-center justify-between">
                            <div className="flex items-center gap-1 text-xs font-medium text-gray-400">
                              {session.capacity && (
                                <>Lotação: <span className="text-gray-700 font-bold">{session.capacity.current}/{session.capacity.max}</span></>
                              )}
                            </div>

                            {session.status === 'active' ? (
                              <button
                                onClick={handleStartClass}
                                className="bg-[#1f8aad] hover:bg-[#187a8a] text-white text-sm font-bold py-1.5 px-4 rounded-lg shadow-sm flex items-center gap-2 active:scale-95 transition-transform"
                              >
                                Iniciar Aula <ChevronRight size={14} />
                              </button>
                            ) : (
                              <button
                                onClick={(e) => handleCancelClass(session.id, e)}
                                className="text-red-500 text-xs font-bold py-1.5 px-3 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1.5"
                              >
                                Cancelar aula
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </main>

      {/* FAB to add new class */}
      <button
        onClick={() => setIsNewClassModalOpen(true)}
        className="fixed bottom-24 right-5 w-14 h-14 bg-slate-900 text-white rounded-full shadow-lg shadow-slate-900/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-30"
      >
        <Plus size={28} />
      </button>

      {/* New Class Modal */}
      {isNewClassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsNewClassModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500"
            >
              <X size={18} />
            </button>

            <h2 className="text-xl font-bold text-gray-900 mb-6">{editingClassId ? 'Editar Aula' : 'Agendar Nova Aula'}</h2>

            <form onSubmit={handleSaveClass} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Título da Aula</label>
                <input
                  type="text"
                  value={newClassTitle}
                  onChange={(e) => setNewClassTitle(e.target.value)}
                  placeholder="Ex: Treino de Competição"
                  className="w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#1f8aad] focus:ring-0 text-gray-900 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setNewClassModality('Jiu-Jitsu')}
                  className={`h-12 rounded-xl border flex items-center justify-center font-bold text-sm transition-all ${newClassModality === 'Jiu-Jitsu' ? 'bg-[#1f8aad] text-white border-[#1f8aad]' : 'bg-white text-gray-500 border-gray-200'}`}
                >
                  Jiu-Jitsu
                </button>
                <button
                  type="button"
                  onClick={() => setNewClassModality('Judô')}
                  className={`h-12 rounded-xl border flex items-center justify-center font-bold text-sm transition-all ${newClassModality === 'Judô' ? 'bg-[#1f8aad] text-white border-[#1f8aad]' : 'bg-white text-gray-500 border-gray-200'}`}
                >
                  Judô
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Início</label>
                  <input
                    type="time"
                    value={newClassStartTime}
                    onChange={(e) => setNewClassStartTime(e.target.value)}
                    className="w-full h-12 px-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#1f8aad] focus:ring-0 text-gray-900 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Fim</label>
                  <input
                    type="time"
                    value={newClassEndTime}
                    onChange={(e) => setNewClassEndTime(e.target.value)}
                    className="w-full h-12 px-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#1f8aad] focus:ring-0 text-gray-900 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Observações</label>
                <div className="relative">
                  <textarea
                    value={newClassObservations}
                    onChange={(e) => setNewClassObservations(e.target.value)}
                    placeholder="Instruções especiais, equipamentos necessários..."
                    className="w-full h-24 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#1f8aad] focus:ring-0 text-gray-900 font-medium resize-none"
                  />
                  <AlignLeft size={18} className="absolute right-3 top-3 text-gray-400" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full h-12 mt-2 bg-[#1f8aad] hover:bg-[#187a8a] text-white font-bold rounded-xl shadow-lg shadow-[#1f8aad]/20 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-wait"
              >
                {isSaving ? 'Salvando...' : (editingClassId ? 'Salvar Alterações' : 'Agendar')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Class Details Modal */}
      {selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setSelectedClass(null)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500"
            >
              <X size={18} />
            </button>

            <div className="flex flex-col gap-1 mb-6">
              <span className={`text-xs font-bold uppercase tracking-wide w-fit px-2 py-0.5 rounded-md ${selectedClass.modality === 'Jiu-Jitsu' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'
                }`}>
                {selectedClass.modality}
              </span>
              <h2 className="text-xl font-bold text-gray-900 leading-tight">{selectedClass.title}</h2>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500">
                  <Clock size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Horário</p>
                  <p className="text-sm font-bold text-gray-900">{selectedClass.time} - {selectedClass.endTime}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500">
                  <Users size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Instrutor</p>
                  <p className="text-sm font-bold text-gray-900">{selectedClass.instructor}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500">
                  <MapPin size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Local</p>
                  <p className="text-sm font-bold text-gray-900">{selectedClass.location}</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 group focus-within:ring-2 focus-within:ring-[#1f8aad] transition-all relative">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-xs font-bold text-gray-400 uppercase">Observações</p>
                  <Edit3 size={14} className="text-gray-300" />
                </div>
                <textarea
                  value={editingObservations}
                  onChange={(e) => setEditingObservations(e.target.value)}
                  placeholder="Adicione observações sobre esta aula..."
                  className="w-full bg-transparent border-none p-0 text-sm text-gray-700 font-medium leading-relaxed resize-none focus:ring-0 placeholder:text-gray-400"
                  rows={3}
                />
                {editingObservations !== (selectedClass.observations || '') && (
                  <button
                    onClick={handleUpdateObservations}
                    disabled={isUpdatingObs}
                    className="mt-2 w-full py-2 bg-[#1f8aad] text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
                  >
                    {isUpdatingObs ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Save size={14} /> Salvar Observação
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleEditClass}
                className="h-12 w-12 bg-gray-100 text-gray-600 rounded-xl flex items-center justify-center hover:bg-gray-200 transition-colors"
                title="Editar Aula"
              >
                <Edit3 size={20} />
              </button>

              {selectedClass.status === 'active' ? (
                <button
                  onClick={() => navigate('/attendance')}
                  className="flex-1 h-12 bg-[#1f8aad] text-white font-bold rounded-xl shadow-lg shadow-[#1f8aad]/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                >
                  Iniciar Aula <ChevronRight size={18} />
                </button>
              ) : (
                <button
                  onClick={(e) => handleCancelClass(selectedClass.id, e)}
                  className="flex-1 h-12 bg-red-50 text-red-600 font-bold rounded-xl border border-red-100 flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:bg-red-100"
                >
                  <Trash2 size={18} /> Cancelar Aula
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};