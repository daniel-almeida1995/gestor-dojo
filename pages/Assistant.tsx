import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, ArrowLeft, Sparkles } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface Message {
  id: string;
  text: string;
  sender: 'bot' | 'user';
  actions?: string[];
}

export const Assistant = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Olá Sensei! Eu sou seu assistente virtual. Posso ajudar com cadastros, financeiro, turmas e presença.\n\nO que deseja fazer hoje?',
      sender: 'bot',
      actions: ['Cadastrar Aluno', 'Listar Inadimplentes', 'Nova Turma', 'Consultar Aluno']
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Logic to simulate AI analysis for Churn Risk
  const analyzeChurnRisk = () => {
    // Mock Data based on the prompt scenario - CLEARED for fresh start
    const risks: any[] = [];

    if (risks.length === 0) {
        return "Ótima notícia! Não identifiquei nenhum aluno com risco iminente de evasão no momento.";
    }

    let report = `Existem ${risks.length} alunos em risco de evasão hoje.\n`;
    risks.forEach((r, i) => {
        report += `${i+1}. ${r.name} (${r.modality}) — ${r.reason}.\n`;
    });
    report += "\nDeseja realizar alguma ação com esses alunos?";
    
    return report;
  };

  useEffect(() => {
    if (location.state?.initialAction === 'check_churn_risk') {
       // Append a user-like action or just a system start
       // Let's make it feel like the system is initiating the report
       const loadingMsg: Message = {
           id: Date.now().toString(),
           text: 'Identificando alunos em risco de evasão...',
           sender: 'bot'
       };
       setMessages(prev => [...prev, loadingMsg]);

       setTimeout(() => {
           const analysisMsg: Message = {
               id: (Date.now() + 1).toString(),
               text: analyzeChurnRisk(),
               sender: 'bot',
               actions: [] // No actions needed if no risks
           };
           setMessages(prev => [...prev, analysisMsg]);
       }, 1000);
    }
  }, [location.state]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), text: input, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    // Simulate basic AI logic based on provided flows
    setTimeout(() => {
      let botResponse: Message = { id: (Date.now() + 1).toString(), text: 'Desculpe, não entendi. Pode repetir ou selecionar uma opção?', sender: 'bot' };

      const lowerInput = input.toLowerCase();

      // FLUXO 1 - CADASTRO
      if (lowerInput.includes('cadastrar') || lowerInput.includes('novo aluno')) {
        botResponse = {
           id: (Date.now() + 1).toString(),
           text: 'Iniciando cadastro de novo aluno.\n\nVocê prefere usar o formulário padrão ou fazer isso por aqui?',
           sender: 'bot',
           actions: ['Abrir Formulário', 'Continuar no Chat']
        };
      } 
      // FLUXO 7 - INADIMPLENTES
      else if (lowerInput.includes('inadimplentes') || lowerInput.includes('atraso') || lowerInput.includes('pagamento')) {
         botResponse = {
           id: (Date.now() + 1).toString(),
           text: 'Consultando alunos inadimplentes...\n\nNão encontrei nenhuma pendência financeira no momento.',
           sender: 'bot',
           actions: ['Ver Financeiro']
        };
      } 
      // FLUXO 8 - TURMA
      else if (lowerInput.includes('turma')) {
         botResponse = {
           id: (Date.now() + 1).toString(),
           text: 'Vamos cadastrar uma nova turma.\n\nInforme a modalidade da turma.',
           sender: 'bot',
           actions: ['Jiu-Jitsu', 'Judô']
         };
      }
      // FLUXO 9 - PRESENÇA
      else if (lowerInput.includes('presença') || lowerInput.includes('chamada')) {
        botResponse = {
          id: (Date.now() + 1).toString(),
          text: 'Para qual turma deseja registrar presença hoje?',
          sender: 'bot',
          actions: ['Judô 19:00', 'BJJ 20:30']
        };
      }

      setMessages(prev => [...prev, botResponse]);
    }, 600);
  };

  const handleAction = (action: string) => {
    // Navigation actions
    if (action === 'Abrir Formulário') {
      navigate('/student/new');
      return;
    }
    if (action === 'Ver Financeiro') {
      navigate('/payments');
      return;
    }
    
    // Chat simulation actions
    const userMsg: Message = { id: Date.now().toString(), text: action, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    
    setTimeout(() => {
       if (action === 'Continuar no Chat') {
          setMessages(prev => [...prev, {
             id: Date.now().toString(),
             text: 'Ok. Informe o nome completo do aluno.',
             sender: 'bot'
          }]);
       } else if (action === 'Cobrar no WhatsApp' || action === 'Enviar Lembrete de Pagamento') {
          setMessages(prev => [...prev, {
             id: Date.now().toString(),
             text: 'Lembretes enviados via WhatsApp para os alunos selecionados.',
             sender: 'bot'
          }]);
       } else if (action === 'Registrar Contato') {
          setMessages(prev => [...prev, {
             id: Date.now().toString(),
             text: 'Histórico de contato atualizado no CRM para os alunos listados.',
             sender: 'bot'
          }]);
       } else if (action === 'Judô 19:00' || action === 'BJJ 20:30') {
          navigate('/attendance');
       } else {
         setMessages(prev => [...prev, {
            id: Date.now().toString(),
            text: `Entendido: ${action}. \n\nPodemos prosseguir com a próxima etapa.`,
            sender: 'bot'
         }]);
       }
    }, 800);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 max-w-md mx-auto relative">
       {/* Header */}
       <div className="bg-white px-4 py-3 flex items-center gap-3 border-b border-gray-200 shadow-sm shrink-0 sticky top-0 z-20">
          <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"><ArrowLeft size={24} className="text-gray-600"/></button>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white shadow-md">
             <Sparkles size={20} />
          </div>
          <div>
             <h1 className="font-bold text-gray-900 leading-tight">Assistente Dojo</h1>
             <p className="text-xs text-green-600 font-bold flex items-center gap-1">
               <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Online
             </p>
          </div>
       </div>

       {/* Messages */}
       <div className="flex-1 overflow-y-auto p-4 space-y-5 pb-24 no-scrollbar">
          {messages.map((msg) => (
             <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                <div className={`flex gap-2 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                   <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.sender === 'user' ? 'bg-gray-200 text-gray-600' : 'bg-primary/10 text-primary'}`}>
                      {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
                   </div>
                   <div className={`p-3.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line shadow-sm ${
                      msg.sender === 'user' 
                        ? 'bg-primary text-white rounded-tr-none' 
                        : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                   }`}>
                      {msg.text}
                   </div>
                </div>
                {msg.actions && (
                   <div className="flex flex-wrap gap-2 mt-2 ml-10 max-w-[90%]">
                      {msg.actions.map(action => (
                         <button 
                           key={action}
                           onClick={() => handleAction(action)}
                           className="bg-white border border-primary/20 text-primary hover:bg-primary/10 hover:border-primary text-xs font-bold py-2 px-3 rounded-xl transition-all shadow-sm active:scale-95"
                         >
                           {action}
                         </button>
                      ))}
                   </div>
                )}
             </div>
          ))}
          <div ref={messagesEndRef} />
       </div>

       {/* Input */}
       <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md p-3 border-t border-gray-200 pb-safe z-30 max-w-md mx-auto">
          <div className="relative flex gap-2">
             <input 
               type="text" 
               value={input}
               onChange={(e) => setInput(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && handleSend()}
               placeholder="Digite sua mensagem..."
               className="flex-1 h-12 bg-gray-100 border-transparent focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-2xl px-5 transition-all outline-none text-sm font-medium"
             />
             <button 
               onClick={handleSend}
               disabled={!input.trim()}
               className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20 active:scale-95"
             >
               <Send size={20} />
             </button>
          </div>
       </div>
    </div>
  );
};