import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, User, MessageSquare, ChevronRight, Check, ArrowRight, Phone, Camera, AlertCircle, HeartPulse, Trash2, DollarSign, Plus, Minus, Award, Calendar } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStudents } from '../contexts/StudentContext';
import { Student } from '../types';

// Helper to render belt visual
const BeltBar = ({ color, degrees, className }: { color: string, degrees?: number, className?: string }) => {
  const isBlackBelt = color.toLowerCase().includes('#000') || color.toLowerCase().includes('black') || color === '#000000';
  const barColor = isBlackBelt ? '#ef4444' : '#1a1a1a'; // Red bar for black belt, black for others
  
  return (
    <div className={`h-16 w-full rounded-lg flex items-center shadow-md border border-gray-200 relative overflow-hidden ${className}`}>
      {/* Fabric Texture Overlay */}
      <div className="absolute inset-0 z-10 opacity-30 pointer-events-none mix-blend-overlay" 
           style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'4\' height=\'4\' viewBox=\'0 0 4 4\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M1 3h1v1H1V3zm2-2h1v1H3V1z\' fill=\'%23000000\' fill-opacity=\'0.4\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")' }}>
      </div>
      
      {/* Main Belt Color */}
      <div className="flex-1 h-full relative transition-colors duration-300" style={{ backgroundColor: color }}>
        {/* Shadow/Highlight for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-black/10 pointer-events-none"></div>
      </div>
      
      {/* Ranking Bar (Ponta) */}
      <div className="w-28 h-full relative flex items-center justify-evenly px-2 z-20 shadow-[-2px_0_5px_rgba(0,0,0,0.2)]" style={{ backgroundColor: barColor }}>
        {/* Shadow for depth on bar */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-black/20 pointer-events-none"></div>

        {/* Degrees */}
        {[...Array(4)].map((_, i) => (
          <div 
            key={i} 
            className={`w-3 h-10 rounded-[1px] shadow-sm transition-all duration-300 transform ${
              (degrees || 0) > i 
                ? 'bg-white scale-100 opacity-100 shadow-[0_1px_2px_rgba(0,0,0,0.3)]' 
                : 'bg-white/10 scale-90 opacity-0'
            }`}
          ></div>
        ))}
      </div>
    </div>
  );
};

export const NewStudent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addStudent, updateStudent, deleteStudent } = useStudents();
  
  const editingStudent = location.state?.student as Student | undefined;
  const isEditing = !!editingStudent;

  const [modality, setModality] = useState('Jiu-Jitsu');
  
  // Form States
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [belt, setBelt] = useState('');
  const [degrees, setDegrees] = useState(0);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Financial States
  const [monthlyFee, setMonthlyFee] = useState('150');
  const [isExempt, setIsExempt] = useState(false);
  const [dueDay, setDueDay] = useState(10); // Default due day

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Error States
  const [errors, setErrors] = useState<{name?: string; phone?: string}>({});

  const modalities = [
    { name: 'Jiu-Jitsu', icon: '🥋' },
    { name: 'Judô', icon: '🤼' }
  ];

  // Map display belt names to value keys
  const mapBeltToValue = (displayBelt: string) => {
    if (!displayBelt) return '';
    const lower = displayBelt.toLowerCase();
    if (lower.includes('branca')) return 'white';
    if (lower.includes('azul')) return 'blue';
    if (lower.includes('roxa')) return 'purple';
    if (lower.includes('marrom')) return 'brown';
    if (lower.includes('preta')) return 'black';
    return 'white'; // Default fallback
  };

  const getBeltDisplay = (value: string) => {
      switch(value) {
          case 'white': return 'Faixa Branca';
          case 'blue': return 'Faixa Azul';
          case 'purple': return 'Faixa Roxa';
          case 'brown': return 'Faixa Marrom';
          case 'black': return 'Faixa Preta';
          default: return 'Iniciante';
      }
  };

  const getBeltColor = (value: string) => {
      switch(value) {
          case 'white': return '#f8fafc'; // Slate-50 for better visibility than pure white
          case 'blue': return '#2563eb';
          case 'purple': return '#9333ea';
          case 'brown': return '#854d0e';
          case 'black': return '#000000';
          default: return '#f8fafc';
      }
  };

  useEffect(() => {
    if (editingStudent) {
      setName(editingStudent.name || '');
      setPhone(editingStudent.phone || ''); 
      setModality(editingStudent.modality || 'Jiu-Jitsu');
      setBelt(mapBeltToValue(editingStudent.belt));
      setDegrees(editingStudent.degrees || 0);
      setPhotoPreview(editingStudent.avatar || null);
      
      // Mock emergency info preservation would go here if it was in the type
      setEmergencyName('Contato de Emergência');
      setEmergencyPhone('(11) 98888-7777');

      if (editingStudent.monthlyFee) {
        setMonthlyFee(editingStudent.monthlyFee.toString());
        setIsExempt(editingStudent.monthlyFee === 0);
      } else {
        setMonthlyFee('150');
        setIsExempt(false);
      }
      
      if (editingStudent.dueDay) {
        setDueDay(editingStudent.dueDay);
      }
    }
  }, [editingStudent]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleDelete = async () => {
    if(isEditing && editingStudent && window.confirm('Tem certeza que deseja excluir este aluno?')) {
        await deleteStudent(editingStudent.id);
        navigate('/students');
    }
  };

  const handleAddDegree = (e: React.MouseEvent) => {
    e.preventDefault();
    if (degrees >= 4) {
        return;
    }
    setDegrees(prev => prev + 1);
  };

  const handleRemoveDegree = (e: React.MouseEvent) => {
    e.preventDefault();
    if (degrees > 0) {
        setDegrees(prev => prev - 1);
    }
  };

  const handleSave = async () => {
    const newErrors: {name?: string; phone?: string} = {};
    let isValid = true;

    // Validate Name
    if (!name.trim()) {
      newErrors.name = 'O nome do aluno é obrigatório';
      isValid = false;
    } else if (name.trim().length < 3) {
      newErrors.name = 'O nome deve ter pelo menos 3 letras';
      isValid = false;
    }

    // Validate Phone (Simple check for digits length)
    const phoneDigits = phone.replace(/\D/g, '');
    if (!phone.trim()) {
      newErrors.phone = 'O WhatsApp é obrigatório';
      isValid = false;
    } else if (phoneDigits.length < 10) {
      newErrors.phone = 'Informe um número válido com DDD';
      isValid = false;
    }

    setErrors(newErrors);

    if (isValid) {
      setIsSaving(true);
      const beltDisplayName = getBeltDisplay(belt);
      const beltColorHex = getBeltColor(belt);

      // Handle History Update for Graduation
      let updatedHistory = isEditing && editingStudent?.history ? [...editingStudent.history] : [];
      
      // If editing and belt changed, add to history
      if (isEditing && editingStudent && editingStudent.belt !== beltDisplayName) {
        updatedHistory.unshift({
          date: new Date().toISOString(),
          type: 'belt',
          description: `Graduação para ${beltDisplayName}`
        });
      }

      // If new student, add initial history
      if (!isEditing) {
        updatedHistory = [{
          date: new Date().toISOString(),
          type: 'belt',
          description: `Início na ${beltDisplayName}`
        }];
      }

      const finalMonthlyFee = isExempt ? 0 : parseFloat(monthlyFee.replace(',', '.')) || 0;

      const studentData: Student = {
          id: isEditing && editingStudent ? editingStudent.id : '', // ID handled by DB on insert
          name,
          phone,
          modality,
          avatar: photoPreview || '',
          belt: beltDisplayName,
          beltColor: beltColorHex,
          status: 'active', // Default for new students
          classesAttended: isEditing && editingStudent ? editingStudent.classesAttended : 0,
          degrees: degrees,
          history: updatedHistory,
          dueDay: dueDay,
          monthlyFee: finalMonthlyFee
      };

      try {
        if (isEditing && editingStudent) {
            await updateStudent(studentData.id, studentData);
        } else {
            await addStudent(studentData);
        }
        navigate('/students');
      } catch (error) {
        console.error(error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full active:bg-gray-100 transition-colors">
          <ArrowLeft size={24} className="text-gray-900" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">{isEditing ? 'Editar Aluno' : 'Novo Aluno'}</h1>
        {isEditing ? (
           <button onClick={handleDelete} className="w-10 h-10 flex items-center justify-center rounded-full text-red-500 hover:bg-red-50">
              <Trash2 size={20} />
           </button>
        ) : (
           <button onClick={() => navigate(-1)} className="text-sm font-semibold text-gray-500">Cancelar</button>
        )}
      </header>

      <main className="flex-1 px-5 pt-6 pb-24 flex flex-col gap-8">
        
        {/* Photo Upload Section */}
        <div className="flex flex-col items-center justify-center mb-2">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handlePhotoSelect}
            />
            <div 
              onClick={triggerFileInput}
              className="relative group cursor-pointer active:scale-95 transition-transform"
            >
                <div className="w-32 h-32 rounded-full bg-gray-100 border-4 border-white shadow-sm flex items-center justify-center text-gray-300 overflow-hidden">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <User size={64} />
                    )}
                </div>
                <button className="absolute bottom-0 right-1 w-10 h-10 bg-green-600 text-white rounded-full border-4 border-white flex items-center justify-center shadow-md hover:bg-green-700 transition-colors">
                    <Camera size={20} />
                </button>
            </div>
            <p className="text-xs font-bold text-gray-400 mt-3 uppercase tracking-wide">
              {isEditing ? 'Alterar foto' : 'Toque para adicionar foto'}
            </p>
        </div>

        <section>
          <div className="flex items-center gap-2 mb-4 text-green-600">
            <User size={20} />
            <h2 className="text-lg font-bold text-gray-900">Informações Pessoais</h2>
          </div>
          <div className="space-y-4">
            
            {/* Name Input */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Nome Completo <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if(errors.name) setErrors({...errors, name: undefined});
                }}
                placeholder="Ex: João Silva" 
                className={`w-full h-14 px-4 rounded-2xl bg-white border focus:ring-0 text-gray-900 transition-shadow shadow-sm ${
                  errors.name 
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-gray-200 focus:border-green-500'
                }`}
              />
              {errors.name && (
                <div className="flex items-center gap-1 mt-1.5 ml-1 text-red-500 text-xs font-bold">
                  <AlertCircle size={12} />
                  <span>{errors.name}</span>
                </div>
              )}
            </div>

            {/* Phone Input */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">WhatsApp <span className="text-red-500">*</span></label>
              <div className="relative">
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if(errors.phone) setErrors({...errors, phone: undefined});
                  }}
                  placeholder="(00) 00000-0000" 
                  className={`w-full h-14 px-4 pl-12 rounded-2xl bg-white border focus:ring-0 text-gray-900 transition-shadow shadow-sm ${
                    errors.phone 
                      ? 'border-red-500 focus:border-red-500' 
                      : 'border-gray-200 focus:border-green-500'
                  }`}
                />
                <MessageSquare className={`absolute left-4 top-1/2 -translate-y-1/2 ${errors.phone ? 'text-red-400' : 'text-gray-400'}`} size={20} />
              </div>
              {errors.phone && (
                <div className="flex items-center gap-1 mt-1.5 ml-1 text-red-500 text-xs font-bold">
                  <AlertCircle size={12} />
                  <span>{errors.phone}</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Emergency Contact Section */}
        <section>
          <div className="flex items-center gap-2 mb-4 text-green-600">
            <HeartPulse size={20} />
            <h2 className="text-lg font-bold text-gray-900">Contato de Emergência</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Nome do Contato</label>
              <input 
                type="text" 
                value={emergencyName}
                onChange={(e) => setEmergencyName(e.target.value)}
                placeholder="Nome do responsável" 
                className="w-full h-14 px-4 rounded-2xl bg-white border border-gray-200 focus:border-green-500 focus:ring-0 text-gray-900 transition-shadow shadow-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Telefone de Emergência</label>
              <div className="relative">
                <input 
                  type="tel" 
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  placeholder="(00) 00000-0000" 
                  className="w-full h-14 px-4 pl-12 rounded-2xl bg-white border border-gray-200 focus:border-green-500 focus:ring-0 text-gray-900 transition-shadow shadow-sm"
                />
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              </div>
            </div>
          </div>
        </section>

        <div className="h-px bg-gray-200 w-full" />

        <section>
          <div className="flex items-center gap-2 mb-4 text-green-600">
            <span className="text-xl">🥋</span>
            <h2 className="text-lg font-bold text-gray-900">Detalhes do Treino</h2>
          </div>
          
          <div className="mb-6">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 ml-1">Modalidade</label>
            <div className="flex justify-start gap-3 overflow-x-auto pb-4 -mx-5 px-5 no-scrollbar">
              {modalities.map((m) => (
                <button
                  key={m.name}
                  onClick={() => setModality(m.name)}
                  className={`flex-shrink-0 w-28 h-32 rounded-2xl border flex flex-col items-center justify-center gap-3 transition-all ${
                    modality === m.name 
                      ? 'border-green-500 bg-green-50 text-green-700' 
                      : 'border-gray-200 bg-white text-gray-500'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                     modality === m.name ? 'bg-green-500 text-white' : 'bg-gray-100'
                  }`}>
                    {m.icon}
                  </div>
                  <span className="font-bold text-sm">{m.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Faixa Atual</label>
            <div className="relative mb-4">
              <select 
                value={belt}
                onChange={(e) => {
                  setBelt(e.target.value);
                  setDegrees(0); // Reset degrees when belt changes
                }}
                className="w-full h-16 px-4 pl-12 appearance-none rounded-2xl bg-white border border-gray-200 focus:border-green-500 focus:ring-0 text-gray-900 text-base shadow-sm"
              >
                <option value="" disabled>Selecione a faixa...</option>
                <option value="white">Faixa Branca</option>
                <option value="blue">Faixa Azul</option>
                <option value="purple">Faixa Roxa</option>
                <option value="brown">Faixa Marrom</option>
                <option value="black">Faixa Preta</option>
              </select>
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Check size={20} />
              </div>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                 <ChevronRight size={20} className="rotate-90" />
              </div>
            </div>

            {/* Belt Visual & Degree Control */}
            {belt && (
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 shadow-sm mt-4 animate-in fade-in slide-in-from-top-2">
                    <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Visualização da Faixa</span>
                            <span className="text-[10px] font-bold text-gray-900 uppercase bg-white px-2 py-0.5 rounded-md shadow-sm border border-gray-100">
                                {degrees} {degrees === 1 ? 'Grau' : 'Graus'}
                            </span>
                        </div>
                        <BeltBar color={getBeltColor(belt)} degrees={degrees} />
                    </div>
                    
                    {/* Degree Control */}
                    <div className="flex items-center justify-between gap-4 mt-5 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
                        <button 
                            type="button"
                            onClick={handleRemoveDegree}
                            disabled={degrees <= 0}
                            className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-red-50 hover:text-red-600 active:scale-95 transition-all border border-transparent hover:border-red-100"
                        >
                            <Minus size={22} />
                        </button>
                        
                        <div className="flex flex-col items-center">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Adicionar Graus</span>
                             <div className="flex gap-1">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className={`w-2 h-2 rounded-full ${i < degrees ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                                ))}
                             </div>
                        </div>

                        <button 
                            type="button"
                            onClick={handleAddDegree}
                            disabled={degrees >= 4}
                            className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-green-50 hover:text-green-600 active:scale-95 transition-all border border-transparent hover:border-green-100"
                        >
                            <Plus size={22} />
                        </button>
                    </div>
                </div>
            )}
          </div>
        </section>

        <div className="h-px bg-gray-200 w-full" />

        {/* Financial Section */}
        <section>
          <div className="flex items-center gap-2 mb-4 text-green-600">
            <DollarSign size={20} />
            <h2 className="text-lg font-bold text-gray-900">Financeiro</h2>
          </div>
          
          <div className="space-y-4">
             {/* Exemption Toggle */}
             <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex flex-col">
                   <span className="text-sm font-bold text-gray-900">Aluno Bolsista / Isento</span>
                   <span className="text-xs text-gray-500 font-medium">Não cobrar mensalidade deste aluno</span>
                </div>
                <button 
                   onClick={() => setIsExempt(!isExempt)}
                   className={`w-12 h-7 rounded-full transition-colors relative ${isExempt ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                   <span className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full shadow-sm transition-transform duration-200 ${isExempt ? 'translate-x-5' : ''}`} />
                </button>
             </div>

             {/* Monthly Fee and Due Date Inputs */}
             {!isExempt && (
                <div className="flex gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Valor</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">R$</div>
                      <input 
                        type="number" 
                        value={monthlyFee}
                        onChange={(e) => setMonthlyFee(e.target.value)}
                        placeholder="0,00" 
                        className="w-full h-14 px-4 pl-12 rounded-2xl bg-white border border-gray-200 focus:border-green-500 focus:ring-0 text-gray-900 text-lg font-bold transition-shadow shadow-sm"
                      />
                    </div>
                  </div>
                  
                  <div className="w-1/3">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Vencimento</label>
                    <div className="relative">
                      <select
                        value={dueDay}
                        onChange={(e) => setDueDay(Number(e.target.value))}
                        className="w-full h-14 px-4 appearance-none rounded-2xl bg-white border border-gray-200 focus:border-green-500 focus:ring-0 text-gray-900 text-lg font-bold shadow-sm"
                      >
                         {[...Array(31)].map((_, i) => (
                           <option key={i+1} value={i+1}>{i+1}</option>
                         ))}
                      </select>
                       <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                          <ChevronRight size={16} className="rotate-90" />
                       </div>
                    </div>
                  </div>
                </div>
             )}
          </div>
        </section>

      </main>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100">
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="w-full h-14 bg-green-600 hover:bg-green-700 text-white font-bold text-lg rounded-xl shadow-lg shadow-green-600/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-70 disabled:cursor-wait"
        >
          {isSaving ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <span>{isEditing ? 'Atualizar Aluno' : 'Salvar Aluno'}</span>
              <ArrowRight size={20} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};