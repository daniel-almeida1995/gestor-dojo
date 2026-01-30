import React from 'react';
import { LayoutDashboard, Users, Calendar, DollarSign } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-200 pb-safe z-50">
      <div className="flex justify-around items-center h-20 px-2 pb-2">
        <button 
          onClick={() => navigate('/dashboard')}
          className={`flex flex-col items-center justify-center w-full gap-1 group ${isActive('/dashboard') ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <div className={`p-1.5 rounded-full transition-colors ${isActive('/dashboard') ? 'bg-primary/10' : ''}`}>
            <LayoutDashboard size={24} strokeWidth={isActive('/dashboard') ? 2.5 : 2} />
          </div>
          <span className="text-[10px] font-bold">Início</span>
        </button>

        <button 
          onClick={() => navigate('/students')}
          className={`flex flex-col items-center justify-center w-full gap-1 group ${isActive('/students') ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <div className={`p-1.5 rounded-full transition-colors ${isActive('/students') ? 'bg-primary/10' : ''}`}>
            <Users size={24} strokeWidth={isActive('/students') ? 2.5 : 2} />
          </div>
          <span className="text-[10px] font-bold">Alunos</span>
        </button>

        <button 
          onClick={() => navigate('/schedule')}
          className={`flex flex-col items-center justify-center w-full gap-1 group ${isActive('/schedule') ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <div className={`p-1.5 rounded-full transition-colors ${isActive('/schedule') ? 'bg-primary/10' : ''}`}>
            <Calendar size={24} strokeWidth={isActive('/schedule') ? 2.5 : 2} />
          </div>
          <span className="text-[10px] font-bold">Agenda</span>
        </button>

        <button 
          onClick={() => navigate('/payments')}
          className={`flex flex-col items-center justify-center w-full gap-1 group ${isActive('/payments') ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <div className={`p-1.5 rounded-full transition-colors ${isActive('/payments') ? 'bg-primary/10' : ''}`}>
            <DollarSign size={24} strokeWidth={isActive('/payments') ? 2.5 : 2} />
          </div>
          <span className="text-[10px] font-bold">Financeiro</span>
        </button>
      </div>
    </nav>
  );
};