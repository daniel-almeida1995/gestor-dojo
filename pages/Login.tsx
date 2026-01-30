import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, ArrowRight, Lock, AlertCircle, UserPlus, KeyRound, CheckCircle, ArrowLeft, CheckSquare, Square } from 'lucide-react';
import { supabase } from '../lib/supabase';

type ViewState = 'login' | 'signup' | 'forgot';

export const Login = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<ViewState>('login');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const savedEmail = localStorage.getItem('dojo_saved_email');
    const savedPassword = localStorage.getItem('dojo_saved_password');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
      if (savedPassword) {
        setPassword(savedPassword);
      }
    }
  }, []);

  const clearState = () => {
    setError(null);
    setSuccess(null);
    setLoading(false);
  };

  const switchView = (newView: ViewState) => {
    clearState();
    setView(newView);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Save or Remove Credentials based on Remember Me
    if (rememberMe) {
      localStorage.setItem('dojo_saved_email', email);
      localStorage.setItem('dojo_saved_password', password); // Note: Storing password in localStorage is generally not secure for production apps, but implemented as requested.
    } else {
      localStorage.removeItem('dojo_saved_email');
      localStorage.removeItem('dojo_saved_password');
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError('Credenciais inválidas ou erro no login.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      setSuccess('Conta criada com sucesso! Verifique seu e-mail para confirmar o cadastro antes de entrar.');
      // Opcional: voltar para login após alguns segundos
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao criar conta.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password',
      });

      if (error) throw error;
      setSuccess('Link de recuperação enviado! Verifique sua caixa de entrada.');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao enviar e-mail de recuperação.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      console.error(err);
      setError('Erro ao conectar com Google.');
      setLoading(false);
    }
  };

  // Render content based on current view
  const renderForm = () => {
    switch (view) {
      case 'signup':
        return (
          <form onSubmit={handleSignUp} className="flex flex-col gap-5 py-2 animate-in slide-in-from-right-5 duration-300">
            <div className="space-y-2">
              <label className="text-gray-900 text-sm font-bold ml-1">E-mail</label>
              <div className="relative group">
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sensei@dojo.com"
                  className="w-full h-14 bg-gray-50 rounded-2xl border-transparent focus:border-primary focus:bg-white focus:ring-0 px-4 pl-12 text-base font-medium transition-all"
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-gray-900 text-sm font-bold ml-1">Crie uma Senha</label>
              <div className="relative group">
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full h-14 bg-gray-50 rounded-2xl border-transparent focus:border-primary focus:bg-white focus:ring-0 px-4 pl-12 pr-12 text-base font-medium transition-all"
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className={`w-full mt-4 bg-gray-900 hover:bg-black text-white font-bold text-lg h-14 rounded-2xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-wait' : ''}`}
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Criar Conta</span>
                  <UserPlus size={20} />
                </>
              )}
            </button>
          </form>
        );

      case 'forgot':
        return (
          <form onSubmit={handleForgotPassword} className="flex flex-col gap-5 py-2 animate-in slide-in-from-right-5 duration-300">
             <div className="space-y-2">
              <label className="text-gray-900 text-sm font-bold ml-1">E-mail Cadastrado</label>
              <div className="relative group">
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sensei@dojo.com"
                  className="w-full h-14 bg-gray-50 rounded-2xl border-transparent focus:border-primary focus:bg-white focus:ring-0 px-4 pl-12 text-base font-medium transition-all"
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className={`w-full mt-4 bg-accent hover:bg-orange-600 text-white font-bold text-lg h-14 rounded-2xl shadow-lg shadow-accent/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-wait' : ''}`}
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Enviar Link</span>
                  <KeyRound size={20} />
                </>
              )}
            </button>
          </form>
        );

      default: // login
        return (
          <div className="flex flex-col gap-5 py-2 animate-in slide-in-from-left-5 duration-300">
            <form onSubmit={handleLogin} className="flex flex-col gap-5">
              <div className="space-y-2">
                <label className="text-gray-900 text-sm font-bold ml-1">E-mail</label>
                <div className="relative group">
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sensei@dojo.com"
                    className="w-full h-14 bg-gray-50 rounded-2xl border-transparent focus:border-primary focus:bg-white focus:ring-0 px-4 pl-12 text-base font-medium transition-all"
                  />
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-baseline ml-1">
                  <label className="text-gray-900 text-sm font-bold">Senha</label>
                </div>
                <div className="relative group">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite sua senha"
                    className="w-full h-14 bg-gray-50 rounded-2xl border-transparent focus:border-primary focus:bg-white focus:ring-0 px-4 pl-12 pr-12 text-base font-medium transition-all"
                  />
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div 
                  className="flex items-center gap-2 cursor-pointer group" 
                  onClick={() => setRememberMe(!rememberMe)}
                >
                    <div className={`transition-colors ${rememberMe ? 'text-primary' : 'text-gray-300 group-hover:text-gray-400'}`}>
                        {rememberMe ? <CheckSquare size={20} /> : <Square size={20} />}
                    </div>
                    <span className="text-sm font-bold text-gray-600 select-none">Lembrar de mim</span>
                </div>

                <button 
                  type="button" 
                  onClick={() => switchView('forgot')}
                  className="text-primary text-sm font-bold hover:underline"
                >
                  Esqueceu a senha?
                </button>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className={`w-full mt-2 bg-primary hover:bg-primary-dark text-white font-bold text-lg h-14 rounded-2xl shadow-lg shadow-primary/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-wait' : ''}`}
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Entrar</span>
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>

            <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-bold uppercase">Ou continue com</span>
                <div className="flex-grow border-t border-gray-200"></div>
            </div>

            <button 
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-lg h-14 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-3"
            >
               <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
               </svg>
               <span>Google</span>
            </button>
          </div>
        );
    }
  };

  const getTitle = () => {
    switch (view) {
      case 'signup': return 'Criar Conta';
      case 'forgot': return 'Recuperar Senha';
      default: return 'Painel do Instrutor';
    }
  };

  const getDescription = () => {
    switch (view) {
      case 'signup': return 'Preencha os dados abaixo para começar.';
      case 'forgot': return 'Enviaremos um link para seu e-mail.';
      default: return 'Entre com suas credenciais para continuar.';
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-white overflow-hidden font-sans">
      {/* Header Image Section */}
      <div className="w-full p-4 pb-0">
        <div 
          className="w-full bg-center bg-no-repeat bg-cover flex flex-col justify-end overflow-hidden rounded-3xl min-h-[280px] shadow-lg relative transition-all duration-500"
          style={{
            backgroundImage: `linear-gradient(to bottom, rgba(26, 42, 50, 0) 0%, rgba(26, 42, 50, 0.7) 100%), url("https://lh3.googleusercontent.com/aida-public/AB6AXuBkwKqcdh1314-Ktm3tyOyWNFpBtUVKLiItwdK9tj1oRGXLHwoq6N109KI2KlBi05wTDFFA8mF6q9Zo-3HhuGKCxz_ERssHf1BqB57m1VPJUv0vRaOmIn8kaw8gaBFqEnmOZqvOwgtVD2yFQYCp9PqejmrkMr-x2FUKGINVP3790atepOPiOuQ89CjL2fzQIBobPYiI2aPnkZLxxkOGnB9gJdoXUccUHQdL7aKRAuaQwuezcQi_jwE_-7HzgmpxItwMEgPX5YcP5CI")`
          }}
        >
           {/* Logo Overlay */}
           <div className="absolute top-8 left-0 right-0 flex justify-center">
             <div className="h-20 w-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 shadow-xl">
               <span className="text-white text-4xl font-bold">🥋</span>
             </div>
           </div>
           
           {/* Back Button for non-login views */}
           {view !== 'login' && (
             <button 
               onClick={() => switchView('login')}
               className="absolute top-6 left-6 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30 hover:bg-white/30 transition-all"
             >
               <ArrowLeft size={20} />
             </button>
           )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col px-6 max-w-[480px] w-full mx-auto">
        <div className="pt-8 pb-4 text-center">
          <h2 className="text-gray-900 text-3xl font-bold leading-tight transition-all duration-300">
            {getTitle()}
          </h2>
          <p className="text-gray-500 text-base font-medium mt-2 transition-all duration-300">
            {getDescription()}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-sm font-bold animate-in fade-in slide-in-from-top-1">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-100 rounded-xl flex items-center gap-2 text-green-700 text-sm font-bold animate-in fade-in slide-in-from-top-1">
            <CheckCircle size={18} className="shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {renderForm()}

        <div className="mt-auto py-8 text-center">
          {view === 'login' ? (
            <p className="text-gray-500 text-sm">
              Não tem acesso? <button onClick={() => switchView('signup')} className="text-primary font-bold hover:underline">Crie uma conta</button>
            </p>
          ) : view === 'signup' ? (
             <p className="text-gray-500 text-sm">
              Já tem conta? <button onClick={() => switchView('login')} className="text-primary font-bold hover:underline">Faça Login</button>
            </p>
          ) : (
            <p className="text-gray-500 text-sm">
              Lembrou a senha? <button onClick={() => switchView('login')} className="text-primary font-bold hover:underline">Faça Login</button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};