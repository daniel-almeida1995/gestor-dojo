import React from 'react';
import { ArrowLeft, MessageSquare, AlertTriangle, DollarSign, CalendarX, XCircle, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RiskStudent {
  id: string;
  name: string;
  modality: string;
  reason: string;
  riskType: 'payment' | 'attendance' | 'churn';
}

const riskStudents: RiskStudent[] = [];

export const ChurnRisk = () => {
  const navigate = useNavigate();

  const getRiskIcon = (type: string) => {
    switch(type) {
      case 'payment': return <DollarSign size={18} className="text-red-500" />;
      case 'attendance': return <CalendarX size={18} className="text-orange-500" />;
      default: return <XCircle size={18} className="text-gray-500" />;
    }
  };

  const getRiskColor = (type: string) => {
    switch(type) {
      case 'payment': return 'bg-red-50 text-red-700 border-red-100';
      case 'attendance': return 'bg-orange-50 text-orange-700 border-orange-100';
      default: return 'bg-gray-50 text-gray-700 border-gray-100';
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-safe">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-4 py-3 flex items-center gap-3 border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full active:bg-gray-100 transition-colors">
          <ArrowLeft size={24} className="text-gray-900" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">Risco de Evasão</h1>
      </header>

      <main className="flex-1 p-5 pb-24 space-y-5">
        <div className={`${riskStudents.length > 0 ? 'bg-red-500' : 'bg-green-500'} text-white p-5 rounded-3xl shadow-lg shadow-red-500/20`}>
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                   {riskStudents.length > 0 ? <AlertTriangle size={24} className="text-white" /> : <Check size={24} className="text-white" />}
                </div>
                <h2 className="text-xl font-bold">{riskStudents.length > 0 ? 'Atenção Necessária' : 'Tudo Certo!'}</h2>
            </div>
            <p className="opacity-90 leading-relaxed text-sm font-medium">
                {riskStudents.length > 0 
                  ? `Identificamos ${riskStudents.length} alunos com alta probabilidade de evasão baseados em frequência e pagamentos.`
                  : 'Nenhum aluno identificado com risco de evasão no momento.'}
            </p>
        </div>

        <div className="flex flex-col gap-3">
            {riskStudents.map((student) => (
                <div key={student.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-lg">
                                {student.name.substring(0,2)}
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 text-lg leading-tight">{student.name}</h3>
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">{student.modality}</span>
                            </div>
                        </div>
                    </div>

                    <div className={`p-3 rounded-xl border flex items-center gap-3 ${getRiskColor(student.riskType)}`}>
                        <div className="shrink-0">
                             {getRiskIcon(student.riskType)}
                        </div>
                        <span className="text-sm font-bold leading-tight">{student.reason}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button className="flex items-center justify-center gap-2 h-11 rounded-xl bg-green-50 text-green-700 font-bold text-sm hover:bg-green-100 transition-colors active:scale-95">
                            <MessageSquare size={18} /> WhatsApp
                        </button>
                         <button className="flex items-center justify-center gap-2 h-11 rounded-xl bg-gray-50 text-gray-700 font-bold text-sm hover:bg-gray-100 transition-colors active:scale-95">
                            <User size={18} /> Ver Perfil
                        </button>
                    </div>
                </div>
            ))}
        </div>
      </main>
    </div>
  );
};
import { Check } from 'lucide-react';