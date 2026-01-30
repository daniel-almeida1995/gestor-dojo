import React, { useState, useEffect } from 'react';
import { ArrowLeft, DollarSign, Check, Clock, AlertTriangle, Calendar, Download, X, CreditCard, Banknote, QrCode, Plus } from 'lucide-react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Student, Payment } from '../types';
import { useStudents } from '../contexts/StudentContext';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const StudentFinancial = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const student = location.state?.student as Student;
  const { updateStudent } = useStudents();
  const { user } = useAuth();

  const [transactions, setTransactions] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<Payment | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'cash' | 'card'>('pix');
  
  // New Payment Modal State
  const [isNewPaymentOpen, setIsNewPaymentOpen] = useState(false);
  const [newPaymentDesc, setNewPaymentDesc] = useState('');
  const [newPaymentAmount, setNewPaymentAmount] = useState('');
  const [newPaymentDate, setNewPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [newPaymentType, setNewPaymentType] = useState<'tuition' | 'product' | 'seminar'>('tuition');

  const fetchPayments = async () => {
    if (!student) return;
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('student_id', student.id)
        .order('date', { ascending: false });

      if (error) throw error;

      const mapped: Payment[] = data.map(p => ({
        id: p.id,
        studentId: p.student_id,
        description: p.description,
        amount: p.amount,
        date: p.date,
        status: p.status,
        type: p.type,
        paymentMethod: p.payment_method
      }));

      setTransactions(mapped);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [student]);

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'paid': return 'bg-green-100 text-green-700';
      case 'overdue': return 'bg-red-100 text-red-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'paid': return <Check size={14} />;
      case 'overdue': return <AlertTriangle size={14} />;
      case 'pending': return <Clock size={14} />;
      default: return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'paid': return 'Pago';
      case 'overdue': return 'Atrasado';
      case 'pending': return 'Pendente';
      default: return status;
    }
  };

  const handleCreatePayment = async () => {
    if (!user || !student || !newPaymentDesc || !newPaymentAmount) return;

    try {
        const { error } = await supabase.from('payments').insert([{
            user_id: user.id,
            student_id: student.id,
            description: newPaymentDesc,
            amount: parseFloat(newPaymentAmount.replace(',', '.')),
            date: newPaymentDate,
            type: newPaymentType,
            status: 'pending'
        }]);

        if (error) throw error;
        
        await fetchPayments();
        setIsNewPaymentOpen(false);
        setNewPaymentDesc('');
        setNewPaymentAmount('');
    } catch (error) {
        console.error('Error creating payment:', error);
        alert('Erro ao criar lançamento.');
    }
  };

  const handleConfirmPayment = async () => {
    if (!selectedTransaction) return;

    try {
      // 1. Update Payment in DB
      const { error } = await supabase
        .from('payments')
        .update({ status: 'paid', payment_method: paymentMethod })
        .eq('id', selectedTransaction.id);

      if (error) throw error;

      // 2. Update local list
      setTransactions(prev => prev.map(t => 
        t.id === selectedTransaction.id ? { ...t, status: 'paid', paymentMethod } : t
      ));

      // 3. Update global student status to 'active' if this was a tuition payment
      if (student && (selectedTransaction.type === 'tuition' || selectedTransaction.status === 'overdue')) {
          const now = new Date().toISOString();
          await updateStudent(student.id, { status: 'active', lastPaymentDate: now });
      }

      setSelectedTransaction(null);
    } catch (error) {
      console.error('Error confirming payment:', error);
      alert('Erro ao confirmar pagamento.');
    }
  };

  const totalPaid = transactions.filter(h => h.status === 'paid').reduce((acc, curr) => acc + curr.amount, 0);
  const totalPending = transactions.filter(h => h.status === 'pending' || h.status === 'overdue').reduce((acc, curr) => acc + curr.amount, 0);

  if (!student) {
      return (
          <div className="flex flex-col items-center justify-center min-h-screen">
              <p>Aluno não encontrado</p>
              <button onClick={() => navigate(-1)} className="text-primary mt-4">Voltar</button>
          </div>
      )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-4 py-3 flex items-center gap-3 border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full active:bg-gray-100 transition-colors">
          <ArrowLeft size={24} className="text-gray-900" />
        </button>
        <div className="flex-1">
             <h1 className="text-lg font-bold text-gray-900">Financeiro</h1>
             <p className="text-xs text-gray-500 font-medium">{student.name}</p>
        </div>
      </header>

      <main className="flex-1 p-5 pb-24 space-y-6">
        
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
             <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-1">
                 <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 mb-2">
                     <DollarSign size={16} />
                 </div>
                 <span className="text-xs text-gray-400 font-bold uppercase">Total Pago</span>
                 <span className="text-lg font-bold text-gray-900">R$ {totalPaid.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
             </div>
             <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-1">
                 <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-2">
                     <AlertTriangle size={16} />
                 </div>
                 <span className="text-xs text-gray-400 font-bold uppercase">Pendente</span>
                 <span className={`text-lg font-bold ${totalPending > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                    R$ {totalPending.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                 </span>
             </div>
        </div>

        {/* Transaction History */}
        <div>
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center justify-between">
                <span>Histórico</span>
            </h3>
            
            {loading ? (
                <div className="flex flex-col gap-3">
                    <div className="h-20 bg-gray-200 rounded-2xl animate-pulse"></div>
                    <div className="h-20 bg-gray-200 rounded-2xl animate-pulse"></div>
                </div>
            ) : transactions.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                    <p>Nenhum lançamento encontrado.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {transactions.map((item) => (
                        <div 
                            key={item.id} 
                            onClick={() => setSelectedTransaction(item)}
                            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform hover:border-blue-100"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold ${
                                    item.type === 'product' ? 'bg-purple-50 text-purple-600' : 
                                    item.type === 'seminar' ? 'bg-orange-50 text-orange-600' : 
                                    'bg-blue-50 text-blue-600'
                                }`}>
                                    {item.type === 'product' ? '🥋' : item.type === 'seminar' ? '🎓' : '📅'}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900 leading-tight">{item.description}</p>
                                    <p className="text-xs text-gray-500 font-medium mt-0.5 flex items-center gap-1">
                                        <Calendar size={10} />
                                        {new Date(item.date).toLocaleDateString('pt-BR')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span className="text-sm font-bold text-gray-900">R$ {item.amount.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase flex items-center gap-1 ${getStatusStyle(item.status)}`}>
                                    {getStatusIcon(item.status)}
                                    {getStatusLabel(item.status)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

      </main>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 flex gap-3">
           <button className="flex-1 h-12 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors">
               <Download size={18} />
               Extrato
           </button>
           <button 
             onClick={() => setIsNewPaymentOpen(true)}
             className="flex-1 h-12 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-primary/20"
           >
               <Plus size={18} />
               Novo Pagamento
           </button>
      </div>

      {/* New Payment Modal */}
      {isNewPaymentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
             <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-300">
                 <button 
                  onClick={() => setIsNewPaymentOpen(false)}
                  className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500"
                >
                  <X size={18} />
                </button>
                
                <h3 className="text-xl font-bold text-gray-900 mb-6">Novo Lançamento</h3>
                
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Descrição</label>
                        <input 
                           type="text" 
                           value={newPaymentDesc}
                           onChange={(e) => setNewPaymentDesc(e.target.value)}
                           className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:border-primary focus:ring-0"
                           placeholder="Ex: Mensalidade Outubro"
                        />
                    </div>
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Valor (R$)</label>
                            <input 
                                type="number" 
                                value={newPaymentAmount}
                                onChange={(e) => setNewPaymentAmount(e.target.value)}
                                className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:border-primary focus:ring-0"
                                placeholder="0.00"
                            />
                        </div>
                        <div className="w-1/3">
                            <label className="text-xs font-bold text-gray-500 uppercase">Data</label>
                            <input 
                                type="date" 
                                value={newPaymentDate}
                                onChange={(e) => setNewPaymentDate(e.target.value)}
                                className="w-full h-12 px-2 rounded-xl border border-gray-200 bg-gray-50 focus:border-primary focus:ring-0"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Tipo</label>
                        <div className="grid grid-cols-3 gap-2">
                             {(['tuition', 'product', 'seminar'] as const).map(t => (
                                 <button
                                    key={t}
                                    onClick={() => setNewPaymentType(t)}
                                    className={`h-10 rounded-lg text-xs font-bold uppercase transition-colors ${newPaymentType === t ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}
                                 >
                                    {t === 'tuition' ? 'Mensalidade' : t === 'product' ? 'Produto' : 'Seminário'}
                                 </button>
                             ))}
                        </div>
                    </div>

                    <button 
                      onClick={handleCreatePayment}
                      className="w-full h-14 bg-primary text-white font-bold rounded-xl mt-4 shadow-lg shadow-primary/20"
                    >
                        Criar Lançamento
                    </button>
                </div>
             </div>
        </div>
      )}

      {/* Payment Confirmation Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-300">
                <button 
                  onClick={() => setSelectedTransaction(null)}
                  className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500"
                >
                  <X size={18} />
                </button>

                <div className="text-center mb-6">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${
                        selectedTransaction.status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-blue-50 text-blue-600'
                    }`}>
                        <DollarSign size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">{selectedTransaction.description}</h3>
                    <p className="text-2xl font-extrabold text-gray-900 mt-1">R$ {selectedTransaction.amount.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                    <p className="text-sm text-gray-500 mt-1 flex items-center justify-center gap-1">
                        <Calendar size={12} /> Vencimento: {new Date(selectedTransaction.date).toLocaleDateString('pt-BR')}
                    </p>
                </div>

                {selectedTransaction.status === 'paid' ? (
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
    </div>
  );
};