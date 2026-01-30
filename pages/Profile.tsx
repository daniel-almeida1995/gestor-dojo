import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Camera, LogOut, Mail, User, Phone, Building, Save, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export const Profile = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados do formulário (simulando dados existentes se não houver metadados)
  const [name, setName] = useState(user?.user_metadata?.full_name || 'Mestre Rafael');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('(11) 99999-9999');
  const [academy, setAcademy] = useState('Dojo Central Academy');
  const [avatar, setAvatar] = useState(user?.user_metadata?.avatar_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAb3Mko-ivL-0sCUcpEGgMMhtcd3tp3Qs0cz8d4xaVAa7RsP8uormFu69U-95zSMZlZuZB8FrUOtoj8-x7c7W6sZDmOLxoY2s3Wt3Y1F0RTpiQRHXblhO23_4xrynXjNwlVUyArDUV_Jeol3-fWY2HPZpqE_tFi90wrSK6uxK1-AJVQnGJV-unE-pn4lyX2Pjkl6EhdZcMv5ohUoe1QyeTpp60lpFsWbF3wwpJONxNfnq1w4ZcjSZTfw6SOmbpuU_lIZlrP-vR2KOk');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
            full_name: name,
            avatar_url: avatar,
            // phone e academy seriam salvos em uma tabela 'profiles' separada num app real
        }
      });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
      
      // Pequeno delay para feedback visual antes de voltar (opcional)
      setTimeout(() => {
          // navigate('/dashboard'); 
      }, 1500);

    } catch (error: any) {
      console.error(error);
      setMessage({ type: 'error', text: 'Erro ao atualizar perfil.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
        await signOut();
        navigate('/login');
    } catch (error) {
        console.error('Erro ao sair:', error);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans pb-safe">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-gray-100">
        <button onClick={() => navigate('/dashboard')} className="w-10 h-10 flex items-center justify-center rounded-full active:bg-gray-100 transition-colors">
          <ArrowLeft size={24} className="text-gray-900" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">Meu Perfil</h1>
        <div className="w-10" /> {/* Spacer */}
      </header>

      <main className="flex-1 px-5 pt-8 pb-10 flex flex-col gap-6">
        
        {/* Avatar Upload */}
        <div className="flex flex-col items-center justify-center">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handlePhotoSelect}
            />
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="relative group cursor-pointer active:scale-95 transition-transform"
            >
                <div className="w-32 h-32 rounded-full bg-gray-100 border-4 border-white shadow-md overflow-hidden">
                   <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <button className="absolute bottom-0 right-1 w-10 h-10 bg-primary text-white rounded-full border-4 border-white flex items-center justify-center shadow-md hover:bg-primary-dark transition-colors">
                    <Camera size={18} />
                </button>
            </div>
            <p className="mt-3 text-sm font-medium text-gray-500">Toque para alterar a foto</p>
        </div>

        {/* Feedback Message */}
        {message && (
            <div className={`p-4 rounded-xl flex items-center gap-3 ${
                message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
            }`}>
                {message.type === 'error' && <AlertCircle size={20} />}
                <span className="text-sm font-bold">{message.text}</span>
            </div>
        )}

        {/* Form Fields */}
        <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Nome Completo</label>
              <div className="relative">
                <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-14 pl-12 pr-4 rounded-2xl bg-white border border-gray-200 focus:border-primary focus:ring-0 text-gray-900 font-bold shadow-sm transition-all"
                />
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">E-mail</label>
              <div className="relative">
                <input 
                    type="email" 
                    value={email}
                    disabled
                    className="w-full h-14 pl-12 pr-4 rounded-2xl bg-gray-100 border border-transparent text-gray-500 font-medium cursor-not-allowed"
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              </div>
              <p className="text-xs text-gray-400 mt-1 ml-1">O e-mail não pode ser alterado.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Telefone</label>
              <div className="relative">
                <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full h-14 pl-12 pr-4 rounded-2xl bg-white border border-gray-200 focus:border-primary focus:ring-0 text-gray-900 font-bold shadow-sm transition-all"
                />
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Nome da Academia</label>
              <div className="relative">
                <input 
                    type="text" 
                    value={academy}
                    onChange={(e) => setAcademy(e.target.value)}
                    className="w-full h-14 pl-12 pr-4 rounded-2xl bg-white border border-gray-200 focus:border-primary focus:ring-0 text-gray-900 font-bold shadow-sm transition-all"
                />
                <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              </div>
            </div>
        </div>

        {/* Actions */}
        <div className="mt-4 space-y-3">
            <button 
                onClick={handleSave}
                disabled={loading}
                className="w-full h-14 bg-primary hover:bg-primary-dark text-white font-bold text-lg rounded-2xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-wait"
            >
                {loading ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                    <>
                        <Save size={20} />
                        Salvar Alterações
                    </>
                )}
            </button>

            <button 
                onClick={handleSignOut}
                className="w-full h-14 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-lg rounded-2xl border border-red-100 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            >
                <LogOut size={20} />
                Sair da Conta
            </button>
        </div>

        <div className="text-center mt-4">
             <p className="text-xs text-gray-400">Versão 1.0.2 • DojoManager</p>
        </div>

      </main>
    </div>
  );
};