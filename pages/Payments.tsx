import React, { useState, useMemo, useEffect } from 'react';
import { Search, ArrowRight, AlertTriangle, Check, Clock, X, DollarSign, Calendar, QrCode, CreditCard, Banknote } from 'lucide-react';
import { PullToRefresh } from '../components/PullToRefresh';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Payment } from '../types';

interface PaymentGroup {
  month: string;
  items: Payment[];
}

export const Payments = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<PaymentGroup[]>([]);
  const [filter, setFilter] = useState<'all' | 'overdue' | 'pending'>('all');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'cash' | 'card'>('pix');
  const [isLoading, setIsLoading] = useState(true);

  const loadPayments = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('payments')
        .select(`
          id,
          reference_month,
          amount,
          status,
          payment_method,
          paid_at,
          students (
            id,
            name
          )
        `)
        .order('reference_month', { ascending: false });

      if (error) throw error;

      const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
      
      // Usamos um Map para garantir a ordem de inserção (que segue o order by do banco)
      const groupsMap = new Map<string, Payment[]>();

      (data || []).forEach((item: any) => {
        const dateStr = item.reference_month; 
        let monthKey = 'Outros';

        if (dateStr) {
            // Split manual para evitar problemas de timezone com new Date()
            const parts = dateStr.split('-'); // ex: ["2023", "09", "01"]
            if (parts.length >= 2) {
                const year = parts[0];
                const monthIndex = parseInt(parts[1], 10) - 1; // mês 0-11
                
                if (monthIndex >= 0 && monthIndex < 12) {
                    monthKey = `${monthNames[monthIndex]} ${year}`;
                }
            }
        }
        
        if (!groupsMap.has(monthKey)) {
            groupsMap.set(monthKey, []);
        }
        
        groupsMap.get(monthKey)?.push(item);
      });

      const groups: PaymentGroup[] = Array.from(groupsMap.entries()).map(([month, items]) => ({
        month,
        items
      }));

      setPayments(groups);
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadPayments();
    }
  }, [user]);

  const handleRefresh = async () => {
    await loadPayments();
  };

  // Stats Calculation
  const stats = useMemo(() => {
    let overdueCount = 0;
    let overdueAmount = 0;
    let receivedAmount = 0;

    payments.forEach(group => {
      group.items.forEach(item => {
        if (item.status === 'overdue') {
          overdueCount++;
          overdueAmount += item.amount;
        } else if (item.status === 'paid') {
          receivedAmount += item.amount;
        }
      });
    });

    return { overdueCount, overdueAmount, receivedAmount };
  }, [payments]);

  const filteredData = useMemo(() => {
    return payments.map(group => ({
      ...group,
      items: group.items.filter(item => {
        if (filter === 'all') return true;
        return item.status === filter;
      })
    })).filter(group => group.items.length > 0);
  }, [filter, payments]);

  const handleConfirmPayment = async () => {
    if (!selectedPayment) return;

    try {
        const now = new Date().toISOString();
        
        // 1. Atualizar no Supabase (Pagamento)
        const { error } = await supabase
            .from('payments')
            .update({ 
              status: 'paid', 
              payment_method: paymentMethod,
              paid_at: now
            })
            .eq('id', selectedPayment.id);
        
        if (error) throw error;

        // 2. Atualizar Status do Aluno para Ativo (garantir consistência)
        if (selectedPayment.students?.id) {
             await supabase.from('students').update({
                 last_payment_date: now,
                 status: 'active'
             }).eq('id', selectedPayment.students.id);
        }

        // 3. Recarregar lista para refletir dados do servidor
        await loadPayments();
        
        // 4. Fechar modal
        setSelectedPayment(null);
    } catch (error) {
        console.error('Error updating payment:', error);
        alert('Erro ao atualizar pagamento');
    }
  };

  // Helper para formatar descrição amigável caso não exista
  const getPaymentDescription = (payment: Payment) => {
    if (payment.description) return payment.description;
    
    if (payment.reference_month) {
        const parts = payment.reference_month.split('-');
        const monthIndex = parseInt(parts[1], 10) - 1;
        const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        if (monthIndex >= 0 && monthIndex < 12) {
            return `Mensalidade ${monthNames[monthIndex]}`;
        }
    }
    return 'Pagamento Avulso';
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="flex flex-col min-h-screen bg-gray-50 pb-24 relative">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-transparent transition-all duration-300">
          <div className="px-5 pt-12 pb-3 flex items-end justify-between">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Financeiro</h1>
              <p className="text-xs font-bold text-gray-400 mt-1">Dojo Central Academy</p>
            </div>
            <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200">
              <Search size={20} className="text-gray-900" />
            </button>
          </div>
          
          <div className="px-5 pb-4 flex gap-3 overflow-x-auto no-scrollbar">
            <button 
              onClick={() => setFilter('all')}
              className={`shrink-0 px-5 h-9 rounded-full text-sm font-bold shadow-sm transition-all ${
                filter === 'all' 
                  ? 'bg-[#1f8aad] text-white shadow-blue-900/20' 
                  : 'bg-white border border-gray-200 text-gray-600'
              }`}
            >
              Todos
            </button>
            
            <button 
              onClick={() => setFilter('overdue')}
              className={`shrink-0 pl-4 pr-5 h-9 rounded-full text-sm font-bold flex items-center gap-2 shadow-sm transition-all ${
                filter === 'overdue'
                  ? 'bg-[#1f8aad] text-white shadow-blue-900/20'
                  : 'bg-white border border-gray-200 text-gray-600'
              }`}
            >
              Atrasados 
              <span className={`flex items-center justify-center text-[10px] h-5 min-w-[20px] px-1 rounded-full transition-colors ${
                filter === 'overdue' 
                  ? 'bg-white text-[#1f8aad]' 
                  : 'bg-red-600 text-white'
              }`}>
                {stats.overdueCount}
              </span>
            </button>
            
            <button 
               onClick={() => setFilter('pending')}
               className={`shrink-0 px-5 h-9 rounded-full text-sm font-bold shadow-sm transition-all ${
                filter === 'pending'
                  ? 'bg-[#1f8aad] text-white shadow-blue-900/20'
                  : 'bg-white border border-gray-200 text-gray-600'
              }`}
            >
              Pendentes
            </button>
          </div>
        </header>

        {/* Stats Summary - Only show if filter is all or overdue */}
        <div className="px-5 mt-4 mb-2">
          <div className="flex gap-4 p-5 rounded-2xl bg-slate-900 text-white shadow-xl shadow-slate-200">
            <div className="flex-1 border-r border-white/10">
              <p className="text-xs text-gray-400 font-bold mb-1">Recebido (Total)</p>
              <p className="text-xl font-bold tracking-tight">R$ {stats.receivedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="flex-1 pl-4">
               <p className="text-xs text-red-400 font-bold mb-1 flex items-center gap-1">
                 <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span> Atrasados
               </p>
              <p className="text-xl font-bold tracking-tight">R$ {stats.overdueAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6 pb-6">
          {isLoading ? (
            <div className="px-5 flex flex-col gap-3 mt-4">
               <div className="h-20 bg-gray-200 rounded-2xl animate-pulse"></div>
               <div className="h-20 bg-gray-200 rounded-2xl animate-pulse"></div>
            </div>
          ) : filteredData.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-10 opacity-50">
               <Check size={48} className="text-gray-300 mb-2" />
               <p className="text-gray-500 font-medium">Nenhum pagamento encontrado</p>
             </div>
          ) : (
            filteredData.map((group) => (
              <div key={group.month}>
                 <div className="sticky top-[160px] z-10 bg-gray-50/95 backdrop-blur-sm px-5 py-3">
                   <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">{group.month}</h3>
                 </div>
                 
                 <div className="px-5 flex flex-col gap-3">
                   {group.items.map((item) => {
                     // Determine student info from new structure or legacy
                     const studentName = item.students?.name || item.student?.name || 'Aluno';
                     const studentAvatar = item.students?.avatar || item.student?.avatar;
                     const description = getPaymentDescription(item);

                     return (
                       <div 
                          key={item.id} 
                          onClick={() => setSelectedPayment(item)}
                          className={`bg-white p-4 rounded-2xl shadow-sm border cursor-pointer active:scale-[0.99] transition-all ${item.status === 'overdue' ? 'border-l-4 border-l-red-600' : 'border-gray-100'}`}
                       >
                          <div className="flex items-start justify-between">
                            <div className="flex gap-3 items-center">
                              <div className="relative">
                                {studentAvatar ? (
                                   <img src={studentAvatar} alt={studentName} className="w-12 h-12 rounded-xl object-cover shadow-inner" />
                                ) : (
                                   <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 font-bold">
                                       {studentName.substring(0,2)}
                                   </div>
                                )}
                                {item.status === 'overdue' && (
                                  <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                                    <AlertTriangle size={14} className="text-red-600 fill-red-600" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="text-gray-900 font-bold leading-tight">{studentName}</p>
                                <p className="text-gray-500 text-xs font-medium mt-0.5">{description}</p>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-1">
                              <p className={`text-base font-bold ${item.status === 'overdue' ? 'text-red-600' : item.status === 'paid' ? 'text-[#1f8aad]' : 'text-gray-400'}`}>
                                R$ {item.amount.toFixed(2).replace('.', ',')}
                              </p>
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide flex items-center gap-1 ${
                                item.status === 'overdue' ? 'bg-red-50 text-red-600' : 
                                item.status === 'paid' ? 'bg-blue-50 text-[#1f8aad]' : 
                                'bg-gray-100 text-gray-500'
                              }`}>
                                {item.status === 'paid' && <Check size={10} />}
                                {item.status === 'pending' && <Clock size={10} />}
                                {item.status === 'paid' ? 'PAGO' : item.status === 'overdue' ? 'ATRASADO' : 'PENDENTE'}
                              </span>
                            </div>
                          </div>
                          {item.status === 'overdue' && (
                             <div className="mt-3 pt-3 border-t border-gray-50 flex justify-between items-center opacity-80">
                               <span className="text-[10px] text-gray-400 font-bold">Vencido</span>
                               <button className="text-[11px] font-bold text-[#1f8aad] flex items-center gap-1">
                                 Cobrar no WhatsApp <ArrowRight size={12} />
                               </button>
                             </div>
                          )}
                       </div>
                     );
                   })}
                 </div>
              </div>
            ))
          )}
        </div>

        {/* Payment Action Modal */}
        {selectedPayment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-300">
               <button 
                  onClick={() => setSelectedPayment(null)}
                  className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500"
                >
                  <X size={18} />
                </button>

                <div className="flex flex-col items-center mb-6">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-3 ${
                     selectedPayment.status === 'paid' ? 'bg-green-100 text-green-600' :
                     selectedPayment.status === 'overdue' ? 'bg-red-100 text-red-600' :
                     'bg-gray-100 text-gray-600'
                  }`}>
                     <DollarSign size={32} />
                  </div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                    {selectedPayment.status === 'paid' ? 'Pagamento Realizado' : 'Registrar Pagamento'}
                  </p>
                  <h2 className="text-3xl font-extrabold text-gray-900">R$ {selectedPayment.amount.toFixed(2).replace('.', ',')}</h2>
                  
                  <div className={`mt-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 ${
                      selectedPayment.status === 'paid' ? 'bg-green-50 text-green-700' :
                      selectedPayment.status === 'overdue' ? 'bg-red-50 text-red-700' :
                      'bg-gray-100 text-gray-700'
                  }`}>
                      {selectedPayment.status === 'paid' ? <Check size={12} /> : 
                       selectedPayment.status === 'overdue' ? <AlertTriangle size={12} /> : 
                       <Clock size={12} />}
                      {selectedPayment.status === 'paid' ? 'Pago' : 
                       selectedPayment.status === 'overdue' ? 'Em Atraso' : 'Pendente'}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-2xl p-4 space-y-3 mb-6">
                   <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 font-medium">Aluno</span>
                      <span className="text-gray-900 font-bold">{selectedPayment.students?.name || selectedPayment.student?.name}</span>
                   </div>
                   <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 font-medium">Referência</span>
                      <span className="text-gray-900 font-bold">
                        {getPaymentDescription(selectedPayment)}
                      </span>
                   </div>
                   <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 font-medium">Data</span>
                      <div className="flex items-center gap-1.5 text-gray-900 font-bold">
                         <Calendar size={14} className="text-gray-400" />
                         <span>{selectedPayment.reference_month ? (() => {
                             const [y, m] = selectedPayment.reference_month.split('-').map(Number);
                             return `${m}/${y}`;
                         })() : selectedPayment.date}</span>
                      </div>
                   </div>
                </div>

                {selectedPayment.status !== 'paid' ? (
                  <>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 ml-1">Forma de Pagamento</p>
                    <div className="grid grid-cols-3 gap-2 mb-6">
                      <button 
                        onClick={() => setPaymentMethod('pix')}
                        className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl border transition-all ${
                          paymentMethod === 'pix' 
                            ? 'bg-green-50 border-green-500 text-green-700' 
                            : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <QrCode size={20} />
                        <span className="text-xs font-bold">Pix</span>
                      </button>
                      <button 
                        onClick={() => setPaymentMethod('cash')}
                        className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl border transition-all ${
                          paymentMethod === 'cash' 
                            ? 'bg-green-50 border-green-500 text-green-700' 
                            : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <Banknote size={20} />
                        <span className="text-xs font-bold">Dinheiro</span>
                      </button>
                      <button 
                        onClick={() => setPaymentMethod('card')}
                        className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl border transition-all ${
                          paymentMethod === 'card' 
                            ? 'bg-green-50 border-green-500 text-green-700' 
                            : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <CreditCard size={20} />
                        <span className="text-xs font-bold">Cartão</span>
                      </button>
                    </div>

                    <button 
                      onClick={handleConfirmPayment}
                      className="w-full h-14 bg-green-600 hover:bg-green-700 text-white font-bold text-lg rounded-xl shadow-lg shadow-green-600/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                    >
                      <Check size={20} />
                      <span>Confirmar Recebimento</span>
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => setSelectedPayment(null)}
                    className="w-full h-14 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-lg rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                  >
                     Fechar
                  </button>
                )}
            </div>
          </div>
        )}
      </div>
    </PullToRefresh>
  );
};