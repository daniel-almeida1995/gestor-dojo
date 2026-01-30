import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, ArrowLeft, Plus, X, Wallet, UserCog, CalendarCheck, CheckCircle, AlertTriangle, Clock, Award, ChevronRight, History, Calendar, DollarSign, QrCode, Banknote, CreditCard, Check } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Student } from '../types';
import { PullToRefresh } from '../components/PullToRefresh';
import { useStudents } from '../contexts/StudentContext';
import { useSettings } from '../contexts/SettingsContext';

// Skeleton for student row
const StudentSkeleton = () => (
  <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3 animate-pulse">
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-full bg-gray-200 shrink-0"></div>
        <div className="space-y-2">
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
          <div className="h-3 w-20 bg-gray-200 rounded"></div>
        </div>
      </div>
      <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
    </div>
  </div>
);

const BeltBar = ({ color, degrees, className }: { color: string, degrees?: number, className?: string }) => {
  const isBlackBelt = color.toLowerCase().includes('#000') || color.toLowerCase().includes('black') || color === '#000000';
  const barColor = isBlackBelt ? '#ef4444' : '#1a1a1a';

  return (
    <div className={`h-14 w-full rounded-xl flex items-center overflow-hidden shadow-sm border border-gray-200 relative ${className}`}>
      {/* Fabric Texture Overlay */}
      <div className="absolute inset-0 z-10 opacity-30 pointer-events-none mix-blend-overlay"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'4\' height=\'4\' viewBox=\'0 0 4 4\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M1 3h1v1H1V3zm2-2h1v1H3V1z\' fill=\'%23000000\' fill-opacity=\'0.4\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")' }}>
      </div>

      {/* Main Color */}
      <div className="flex-1 h-full relative" style={{ backgroundColor: color }}>
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-black/10 pointer-events-none"></div>
      </div>

      {/* Ranking Bar (Ponta) */}
      <div className="w-24 h-full flex items-center justify-evenly px-2 relative z-20 shadow-[-2px_0_5px_rgba(0,0,0,0.2)]" style={{ backgroundColor: barColor }}>
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-black/20 pointer-events-none"></div>
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className={`w-2.5 h-8 rounded-[1px] shadow-sm transition-all duration-300 ${(degrees || 0) > i
              ? 'bg-white scale-100 opacity-100 shadow-[0_1px_2px_rgba(0,0,0,0.3)]'
              : 'bg-white/10 scale-90 opacity-0'
              }`}
          ></div>
        ))}
      </div>
    </div>
  );
};

export const Students = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    students,
    loading: isLoading,
    updateStudent,
    page,
    perPage,
    total,
    setPage,
    setSearch,
    setStatusFilter,
    statusFilter
  } = useStudents();

  const { settings } = useSettings();

  const [localSearch, setLocalSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Debounce Search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(localSearch);
    }, 500);
    return () => clearTimeout(timer);
  }, [localSearch, setSearch]);

  // Sync Location State Filter if any
  useEffect(() => {
    const stateFilter = (location.state as any)?.filter;
    if (stateFilter) {
      setStatusFilter(stateFilter);
    }
  }, [location.state, setStatusFilter]);

  // Payment Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'cash' | 'card'>('pix');

  const currentDay = new Date().getDate();
  const today = new Date();

  // Reset history view when student changes or closes
  useEffect(() => {
    if (!selectedStudent) {
      setShowHistory(false);
      setPaymentModalOpen(false);
    }
  }, [selectedStudent]);

  const handleRefresh = async () => {
    // Context refresh is handled implicitly
  };

  // Check if student is overdue based on due day and last payment
  const checkIsOverdue = (student: Student) => {
    // If explicitly marked as payment issue, it's overdue
    if (student.status === 'payment_issue') return true;

    // If inactive or pending, not overdue in the financial sense for this list usually
    if (student.status !== 'active') return false;

    const dueDay = student.dueDay || settings?.default_due_day || 10;

    // If today is before or equal to due day, not overdue yet for this month
    if (currentDay <= dueDay) return false;

    // If today is past due day, check if paid this month
    const lastPayment = student.lastPaymentDate ? new Date(student.lastPaymentDate) : null;
    const isPaidThisMonth = lastPayment &&
      lastPayment.getMonth() === today.getMonth() &&
      lastPayment.getFullYear() === today.getFullYear();

    // Overdue if not paid this month
    return !isPaidThisMonth;
  };

  const getFinancialStatus = (student: Student) => {
    const isOverdue = checkIsOverdue(student);

    if (isOverdue) {
      return { label: 'Atrasado', color: 'bg-red-100 text-red-700', icon: <AlertTriangle size={14} /> };
    }

    switch (student.status) {
      case 'active':
        return { label: 'Em dia', color: 'bg-green-100 text-green-700', icon: <CheckCircle size={14} /> };
      default:
        return { label: 'Inativo', color: 'bg-gray-100 text-gray-500', icon: <X size={14} /> };
    }
  };

  const handleWhatsAppClick = (student: Student) => {
    if (!student.phone) {
      alert('Telefone não cadastrado');
      return;
    }
    const cleanPhone = student.phone.replace(/\D/g, '');

    // Generate Message
    const isOverdue = checkIsOverdue(student);
    let message = `Olá ${student.name.split(' ')[0]}, tudo bem?`;

    if (isOverdue) {
      const dueDay = student.dueDay || settings?.default_due_day || 10;
      message = `Olá ${student.name}, notamos uma pendência na sua mensalidade vencida dia ${dueDay}. Segue chave pix para regularização: (Chave Pix da Academia)`;
    }

    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/55${cleanPhone}?text=${encodedMessage}`;
    window.open(url, '_blank');
  };

  const handleFinancialClick = (student: Student) => {
    navigate(`/student/${student.id}/financial`, { state: { student } });
  };

  const handleAddDegree = () => {
    if (!selectedStudent) return;
    const currentDegrees = selectedStudent.degrees || 0;

    if (currentDegrees >= 4) {
      alert("O aluno já possui 4 graus. Gradue para a próxima faixa no perfil completo.");
      return;
    }

    const newDegrees = currentDegrees + 1;

    const newHistoryItem = {
      date: new Date().toISOString(),
      type: 'degree' as const,
      description: `${newDegrees}º Grau na ${selectedStudent.belt}`
    };

    const updatedHistory = [newHistoryItem, ...(selectedStudent.history || [])];

    const updates = {
      degrees: newDegrees,
      history: updatedHistory
    };

    updateStudent(selectedStudent.id, updates);
    setSelectedStudent(prev => prev ? ({ ...prev, ...updates }) : null);
  };

  const handleConfirmPayment = async () => {
    if (!selectedStudent) return;

    try {
      const now = new Date().toISOString();
      await updateStudent(selectedStudent.id, {
        status: 'active',
        lastPaymentDate: now
      });
      setSelectedStudent(prev => prev ? ({
        ...prev,
        status: 'active',
        lastPaymentDate: now
      }) : null);
      setPaymentModalOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  // derived values for payment modal
  const paymentModalDetails = selectedStudent ? (() => {
    const status = getFinancialStatus(selectedStudent);
    const isPaid = status.label === 'Em dia';
    const amount = selectedStudent.monthlyFee || settings?.default_monthly_fee || 150;
    const currentMonthName = new Date().toLocaleString('pt-BR', { month: 'long' });
    const description = `Mensalidade ${currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1)}`;
    const dueDay = selectedStudent.dueDay || settings?.default_due_day || 10;
    const date = new Date();
    date.setDate(dueDay);

    return { isPaid, amount, description, date };
  })() : null;

  return (
    <>
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="flex flex-col min-h-screen bg-gray-50 pb-24">
          {/* Sticky Header */}
          <div className="sticky top-0 z-30 bg-gray-50/95 backdrop-blur-md border-b border-gray-200">
            <div className="flex items-center p-4 justify-between">
              <button onClick={() => navigate('/dashboard')} className="w-10 h-10 flex items-center justify-center rounded-full active:bg-gray-200 transition-colors">
                <ArrowLeft size={24} className="text-gray-900" />
              </button>
              <h2 className="text-xl font-bold text-gray-900">Gerenciar Alunos</h2>
              <div className="w-10" />
            </div>

            <div className="px-4 pb-2">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Buscar por nome..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="w-full h-12 pl-11 pr-10 rounded-2xl border-none bg-white shadow-sm ring-1 ring-gray-200 focus:ring-2 focus:ring-secondary text-gray-900 placeholder:text-gray-400"
                />
                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-secondary">
                  <SlidersHorizontal size={20} />
                </button>
              </div>
            </div>

            <div className="flex gap-2 px-4 py-3 overflow-x-auto no-scrollbar">
              {[
                { label: 'Todos', value: 'todos' },
                { label: 'Em Dia', value: 'active' },
                { label: 'Atrasados', value: 'payment_issue' },
                { label: 'Inativos', value: 'inactive' }
              ].map((t) => (
                <button
                  key={t.value}
                  onClick={() => setStatusFilter(t.value)}
                  className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${statusFilter === t.value
                    ? 'bg-gray-900 text-white'
                    : 'bg-white border border-gray-200 text-gray-600'
                    }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          <div className="px-4 py-4 flex flex-col gap-3">
            {isLoading ? (
              <>
                <StudentSkeleton />
                <StudentSkeleton />
                <StudentSkeleton />
              </>
            ) : students.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <p className="text-sm">Nenhum aluno encontrado para este filtro.</p>
              </div>
            ) : (
              <>
                {students.map((student) => {
                  const isOverdue = checkIsOverdue(student);

                  return (
                    <div
                      key={student.id}
                      onClick={() => setSelectedStudent(student)}
                      className={`group bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3 active:scale-[0.99] transition-transform cursor-pointer hover:border-secondary/30 ${student.status === 'inactive' ? 'opacity-60' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-14 h-14 rounded-full overflow-hidden shrink-0 ${!student.avatar ? 'bg-amber-100 flex items-center justify-center text-amber-600 font-bold text-lg' : 'bg-gray-100'}`}>
                            {student.avatar ? (
                              <img src={student.avatar} alt={student.name} className="w-full h-full object-cover" />
                            ) : (
                              student.name.split(' ').map(n => n[0]).join('').substring(0, 2)
                            )}
                          </div>
                          <div>
                            <h3 className={`text-base font-bold text-gray-900 ${student.status === 'inactive' ? 'line-through text-gray-400' : ''}`}>{student.name}</h3>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-xs font-bold text-gray-500 uppercase">{student.modality}</span>
                              {student.belt && (
                                <>
                                  <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                  <div className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: student.beltColor }}></span>
                                    <span className="text-xs font-medium text-gray-500">{student.belt}</span>
                                  </div>
                                </>
                              )}
                            </div>
                            {student.dueDay && student.status !== 'inactive' && (
                              <div className="flex items-center gap-1 mt-1">
                                <Calendar size={10} className={isOverdue ? 'text-red-500' : 'text-gray-400'} />
                                <span className={`text-[10px] font-bold ${isOverdue ? 'text-red-500' : 'text-gray-400'}`}>
                                  {isOverdue ? `Venceu dia ${student.dueDay}` : `Vence dia ${student.dueDay}`}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {student.status === 'active' && !isOverdue && (
                          <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Ativo
                          </span>
                        )}
                        {(isOverdue) && (
                          <span className="px-2.5 py-1 rounded-full bg-red-50 text-red-600 text-xs font-bold flex items-center gap-1">
                            <AlertTriangle size={10} /> Atrasado
                          </span>
                        )}
                        {student.status === 'inactive' && (
                          <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 text-xs font-bold flex items-center gap-1">
                            Inativo
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Pagination Controls */}
                <div className="flex items-center justify-between pt-4 pb-20 px-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold disabled:opacity-50 active:scale-95 transition-transform"
                  >
                    Anterior
                  </button>
                  <span className="text-xs font-medium text-gray-500">
                    Página {page} de {Math.max(1, Math.ceil(total / perPage))}
                  </span>
                  <button
                    disabled={page * perPage >= total}
                    onClick={() => setPage(page + 1)}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold disabled:opacity-50 active:scale-95 transition-transform"
                  >
                    Próximo
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </PullToRefresh>

      {/* FAB - Now outside PullToRefresh to ensure fixed positioning works correctly */}
      <button
        onClick={() => navigate('/student/new')}
        className="fixed bottom-24 right-5 w-14 h-14 bg-secondary text-white rounded-full shadow-lg shadow-secondary/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-30"
      >
        <Plus size={28} />
      </button>

      {/* Student Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto no-scrollbar">
            <button
              onClick={() => setSelectedStudent(null)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 z-10"
            >
              <X size={18} />
            </button>

            {/* Header Content */}
            <div className="flex flex-col items-center mb-6 pt-2">
              <div className="w-24 h-24 rounded-full overflow-hidden mb-3 border-4 border-white shadow-lg relative">
                {selectedStudent.avatar ? (
                  <img src={selectedStudent.avatar} alt={selectedStudent.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center text-2xl font-bold text-gray-400">
                    {selectedStudent.name.substring(0, 2)}
                  </div>
                )}
              </div>
              <h2 className="text-2xl font-bold text-gray-900 text-center">{selectedStudent.name}</h2>
              <p className="text-sm font-medium text-gray-500">{selectedStudent.modality} • {selectedStudent.belt}</p>
            </div>

            {/* View Switch: Details or History */}
            {!showHistory ? (
              <>
                {/* Belt Progress Section */}
                {selectedStudent.beltColor && (
                  <div className="mb-6 animate-in slide-in-from-bottom-2 duration-500 delay-100">
                    <div className="flex justify-between items-end mb-2 px-1">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Graduação Atual</span>
                      <button
                        onClick={() => setShowHistory(true)}
                        className="text-xs font-bold text-[#1f8aad] hover:underline flex items-center gap-0.5"
                      >
                        Histórico <ChevronRight size={12} />
                      </button>
                    </div>

                    <div className="bg-gray-50 p-1 rounded-xl mb-3 border border-gray-100">
                      <BeltBar color={selectedStudent.beltColor} degrees={selectedStudent.degrees || 0} className="h-14 rounded-lg" />
                    </div>

                    <button
                      onClick={handleAddDegree}
                      className="w-full py-3 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl text-sm font-bold text-gray-700 flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
                    >
                      <Plus size={16} /> Add Grau
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div
                    onClick={() => setPaymentModalOpen(true)}
                    className="bg-gray-50 p-3 rounded-2xl border border-gray-100 flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 transition-all hover:bg-gray-100 ring-2 ring-transparent hover:ring-gray-200"
                  >
                    <span className="text-[10px] font-bold uppercase text-gray-400">Financeiro</span>
                    {(() => {
                      const status = getFinancialStatus(selectedStudent);

                      return (
                        <div className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 ${status.color}`}>
                          {status.icon}
                          {status.label}
                        </div>
                      );
                    })()}
                    {selectedStudent.dueDay && (
                      <span className="text-[10px] text-gray-400 font-bold mt-1">Dia {selectedStudent.dueDay}</span>
                    )}
                  </div>
                  <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 flex flex-col items-center justify-center gap-1">
                    <span className="text-[10px] font-bold uppercase text-gray-400">Presença</span>
                    <div className="flex items-center gap-1.5 text-gray-700">
                      <CalendarCheck size={16} />
                      <span className="text-sm font-bold">{selectedStudent.classesAttended || 0} Aulas</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleWhatsAppClick(selectedStudent)}
                      className="h-12 flex items-center justify-center gap-2 rounded-xl bg-green-50 text-green-700 font-bold text-sm hover:bg-green-100 transition-colors"
                    >
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                        <path d="M12.04 0C5.39 0 .01 5.39.01 12.04c0 2.13.56 4.12 1.52 5.86L0 24l6.23-1.63c1.7.92 3.65 1.44 5.8 1.44 6.64 0 12.03-5.39 12.03-12.04C24.07 5.39 18.68 0 12.04 0zm6.98 16.94c-.29.81-1.47 1.48-2.03 1.58-.51.09-1.12.15-3.32-.78-2.65-1.11-4.36-3.83-4.5-4.01-.13-.19-1.07-1.43-1.07-2.72 0-1.29.68-1.92.91-2.19.23-.26.51-.33.68-.33.17 0 .34 0 .49.01.16.01.37-.06.57.42.21.49.71 1.74.77 1.86.06.13.1.28.01.44-.08.17-.13.28-.25.42-.13.14-.26.31-.38.42-.13.13-.27.27-.12.53.15.26.68 1.12 1.46 1.81.99.88 1.83 1.15 2.1 1.28.27.13.43.11.59-.07.16-.19.68-.79.86-1.07.18-.27.36-.23.6-.14.24.09 1.53.72 1.79.85.26.13.43.19.49.3.06.1.06.6-.23 1.41z" />
                      </svg>
                      WhatsApp
                    </button>
                    <button
                      onClick={() => handleFinancialClick(selectedStudent)}
                      className="h-12 flex items-center justify-center gap-2 rounded-xl bg-blue-50 text-blue-700 font-bold text-sm hover:bg-blue-100 transition-colors"
                    >
                      <Wallet size={18} />
                      Financeiro
                    </button>
                  </div>
                  <button
                    onClick={() => navigate('/student/edit', { state: { student: selectedStudent } })}
                    className="h-12 w-full flex items-center justify-center gap-2 rounded-xl bg-gray-900 text-white font-bold text-sm hover:bg-gray-800 transition-colors shadow-lg shadow-gray-900/20"
                  >
                    <UserCog size={18} />
                    Ver Perfil Completo
                  </button>
                </div>
              </>
            ) : (
              // HISTORY VIEW
              <div className="animate-in slide-in-from-right-5 duration-300">
                <div className="flex items-center gap-2 mb-4">
                  <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-gray-100 rounded-full">
                    <ArrowLeft size={18} className="text-gray-600" />
                  </button>
                  <h3 className="text-lg font-bold text-gray-900">Histórico de Graduação</h3>
                </div>

                <div className="relative border-l-2 border-gray-100 ml-4 space-y-6 pb-4">
                  {(selectedStudent.history && selectedStudent.history.length > 0) ? (
                    selectedStudent.history.map((event, index) => (
                      <div key={index} className="relative pl-6">
                        <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white shadow-sm ${event.type === 'belt' ? 'bg-[#1f8aad]' : 'bg-gray-400'
                          }`}></div>
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                            {new Date(event.date).toLocaleDateString('pt-BR')}
                          </span>
                          <p className="text-sm font-bold text-gray-900 leading-tight">
                            {event.description}
                          </p>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-fit ${event.type === 'belt' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'
                            }`}>
                            {event.type === 'belt' ? 'Troca de Faixa' : 'Grau'}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center">
                      <History size={32} className="mx-auto text-gray-300 mb-2" />
                      <p className="text-sm text-gray-500 font-medium">Nenhum histórico registrado.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payment Confirmation Modal Overlay */}
      {paymentModalOpen && paymentModalDetails && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setPaymentModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500"
            >
              <X size={18} />
            </button>

            <div className="text-center mb-6">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${paymentModalDetails.isPaid ? 'bg-green-100 text-green-600' : 'bg-blue-50 text-blue-600'
                }`}>
                <DollarSign size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">{paymentModalDetails.description}</h3>
              <p className="text-2xl font-extrabold text-gray-900 mt-1">R$ {paymentModalDetails.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              <p className="text-sm text-gray-500 mt-1 flex items-center justify-center gap-1">
                <Calendar size={12} /> Vencimento: {paymentModalDetails.date.toLocaleDateString('pt-BR')}
              </p>
            </div>

            {paymentModalDetails.isPaid ? (
              <div className="bg-green-50 p-4 rounded-xl border border-green-100 text-center mb-4">
                <div className="flex items-center justify-center gap-2 text-green-700 font-bold mb-1">
                  <Check size={20} />
                  <span>Pagamento Confirmado</span>
                </div>
                <p className="text-xs text-green-600">Este lançamento já foi quitado.</p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 ml-1">Forma de Pagamento</p>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setPaymentMethod('pix')}
                      className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl border transition-all ${paymentMethod === 'pix'
                        ? 'bg-green-50 border-green-500 text-green-700'
                        : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}
                    >
                      <QrCode size={20} />
                      <span className="text-xs font-bold">Pix</span>
                    </button>
                    <button
                      onClick={() => setPaymentMethod('cash')}
                      className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl border transition-all ${paymentMethod === 'cash'
                        ? 'bg-green-50 border-green-500 text-green-700'
                        : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}
                    >
                      <Banknote size={20} />
                      <span className="text-xs font-bold">Dinheiro</span>
                    </button>
                    <button
                      onClick={() => setPaymentMethod('card')}
                      className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl border transition-all ${paymentMethod === 'card'
                        ? 'bg-green-50 border-green-500 text-green-700'
                        : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}
                    >
                      <CreditCard size={20} />
                      <span className="text-xs font-bold">Cartão</span>
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleConfirmPayment}
                  className="w-full h-14 bg-green-600 hover:bg-green-700 text-white font-bold text-lg rounded-xl shadow-lg shadow-green-600/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                >
                  <Check size={20} />
                  <span>Confirmar Recebimento</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};