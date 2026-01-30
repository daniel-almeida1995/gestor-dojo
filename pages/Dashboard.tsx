import React, { useState, useEffect, useRef } from 'react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, ComposedChart, Line } from 'recharts';
import { Users, AlertTriangle, MapPin, Check, UserX, TrendingDown, TrendingUp, DollarSign, PlayCircle, Clock, Sun, Moon, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PullToRefresh } from '../components/PullToRefresh';
import { supabase } from '../lib/supabase';
import { ChevronRight } from 'lucide-react';
import { useFinancials } from '../hooks/useFinancials';
import { useSettings } from '../contexts/SettingsContext';
import { useAttendance } from '../contexts/AttendanceContext';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-xl shadow-xl border border-gray-100 text-xs">
        <p className="font-bold text-gray-900 mb-2">{label}</p>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-gray-400"></span>
          <span className="text-gray-500">Previsto:</span>
          <span className="font-bold text-gray-900">R$ {payload[0].value}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary"></span>
          <span className="text-gray-500">Realizado:</span>
          <span className="font-bold text-primary">R$ {payload[1].value}</span>
        </div>
      </div>
    );
  }
  return null;
};

// Skeleton Component for Dashboard
const DashboardSkeleton = () => (
  <div className="flex flex-col gap-6 animate-pulse">
    {/* Header Skeleton */}
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700"></div>
        <div className="space-y-2">
          <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700"></div>
    </div>

    {/* Live Class Skeleton */}
    <div className="h-48 rounded-3xl bg-gray-200 dark:bg-gray-700 w-full"></div>

    {/* Stats Grid Skeleton */}
    <div className="grid grid-cols-2 gap-4">
      <div className="h-40 rounded-3xl bg-gray-200 dark:bg-gray-700"></div>
      <div className="h-40 rounded-3xl bg-gray-200 dark:bg-gray-700"></div>
    </div>

    {/* Alerts Skeleton */}
    <div className="flex flex-col gap-4">
      <div className="h-20 rounded-2xl bg-gray-200 dark:bg-gray-700 w-full"></div>
      <div className="h-20 rounded-2xl bg-gray-200 dark:bg-gray-700 w-full"></div>
    </div>

    {/* Chart Skeleton */}
    <div className="h-64 rounded-3xl bg-gray-200 dark:bg-gray-700 w-full"></div>
  </div>
);

interface DashboardClass {
  id: string;
  title: string;
  date: string;
  time: string;
  end_time: string;
  modality: string;
  location: string;
  instructor: string;
  status: string;
}

export const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings } = useSettings();
  const { stats, chartData, loading: statsLoading, refreshFinancials } = useFinancials();
  const { todayClasses, refreshTodayClasses, loading: attendanceLoading } = useAttendance(); // Destructured useAttendance

  const [chartReady, setChartReady] = useState(false);
  const [classesLoading, setClassesLoading] = useState(true);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const [upcomingClasses, setUpcomingClasses] = useState<DashboardClass[]>([]);
  const [liveClass, setLiveClass] = useState<DashboardClass | null>(null);

  const isLoading = statsLoading || classesLoading || attendanceLoading; // Updated isLoading

  // Theme Toggle Logic
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') || localStorage.getItem('theme') === 'dark';
    }
    return false;
  });

  const toggleTheme = () => {
    const newMode = !isDark;
    setIsDark(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const formatDateForDB = (date: Date) => {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  };

  // Sync Live Class with Context
  useEffect(() => {
    if (todayClasses) {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      const live = todayClasses.find(c => {
        // todayClasses is already filtered by today from context
        const [startH, startM] = c.time.split(':').map(Number);
        // Assuming end_time exists on ClassWithCapacity interface?
        // We need to check context type definition.
        // context defines: id, title, date, time, modality, instructor, capacity.
        // It MIGHT fail if end_time key is missing in the select inside provider?
        // Checking AttendanceContext: select('*') includes end_time. But interface might need update if typescript complains.
        // I should probably export the Class interface from types or similar.
        // For now, I will cast `c` to any to access end_time if needed, or better, update types?
        // `todayClasses` comes from context.
        const endTime = (c as any).end_time || "23:59"; // Fallback
        const [endH, endM] = endTime.split(':').map(Number);

        const startTotal = startH * 60 + startM;
        const endTotal = endH * 60 + endM;

        return currentMinutes >= startTotal && currentMinutes < endTotal;
      });

      // Map context class to DashboardClass
      if (live) {
        setLiveClass({
          id: live.id,
          title: live.title,
          date: live.date,
          time: live.time,
          end_time: (live as any).end_time,
          modality: live.modality,
          location: 'Tatame', // Default or fetch
          instructor: live.instructor,
          status: 'active'
        });
      } else {
        setLiveClass(null);
      }
    }
  }, [todayClasses]);

  const fetchClasses = async () => {
    if (!user) return;
    try {
      const todayStr = formatDateForDB(new Date());

      // 1. Fetch Future Classes (including today for list for now, but ordered)
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('*')
        .gte('date', todayStr)
        .order('date', { ascending: true })
        .order('time', { ascending: true })
        .limit(5);

      if (classesError) throw classesError;

      if (classesData) {
        setUpcomingClasses(classesData);
      }
    } catch (err) {
      console.error("Error fetching classes:", err);
    } finally {
      setClassesLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
    refreshTodayClasses(); // Ensure context is fresh on mount
  }, [user]);

  useEffect(() => {
    if (!isLoading && chartContainerRef.current) {
      if (chartContainerRef.current.clientWidth > 0) {
        setChartReady(true);
      } else {
        const observer = new ResizeObserver((entries) => {
          for (const entry of entries) {
            if (entry.contentRect.width > 0) {
              setChartReady(true);
              observer.disconnect();
            }
          }
        });
        observer.observe(chartContainerRef.current);
        return () => observer.disconnect();
      }
    }
  }, [isLoading]);

  const handleRefresh = async () => {
    await Promise.all([refreshFinancials(), fetchClasses(), refreshTodayClasses()]);
  };

  // Calculations for the summary
  const percentage = (stats?.totalPredicted ?? 0) > 0 ? Math.round(((stats?.totalRealized ?? 0) / (stats?.totalPredicted ?? 1)) * 100) : 0;
  const difference = (stats?.totalPredicted ?? 0) > 0 ? Math.round((((stats?.totalPredicted ?? 0) - (stats?.totalRealized ?? 0)) / (stats?.totalPredicted ?? 1)) * 100) : 0;

  const userAvatar = user?.user_metadata?.avatar_url || "https://lh3.googleusercontent.com/aida-public/AB6AXuAb3Mko-ivL-0sCUcpEGgMMhtcd3tp3Qs0cz8d4xaVAa7RsP8uormFu69U-95zSMZlZuZB8FrUOtoj8-x7c7W6sZDmOLxoY2s3Wt3Y1F0RTpiQRHXblhO23_4xrynXjNwlVUyArDUV_Jeol3-fWY2HPZpqE_tFi90wrSK6uxK1-AJVQnGJV-unE-pn4lyX2Pjkl6EhdZcMv5ohUoe1QyeTpp60lpFsWbF3wwpJONxNfnq1w4ZcjSZTfw6SOmbpuU_lIZlrP-vR2KOk";
  const userName = user?.user_metadata?.full_name || "Mestre Rafael";

  return (
    <PullToRefresh onRefresh={handleRefresh} isDark={isDark}>
      <div className="flex flex-col gap-6 px-5 py-4 pb-32 transition-colors duration-300 dark:bg-gray-900 min-h-screen">

        {isLoading ? (
          <DashboardSkeleton />
        ) : (
          <>
            {/* Header */}
            <header className="flex items-center justify-between">
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity active:scale-[0.98]"
              >
                <div className="relative">
                  <div
                    className="w-12 h-12 rounded-full bg-cover bg-center border-2 border-primary"
                    style={{ backgroundImage: `url("${userAvatar}")` }}
                  />
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
                </div>
                <div>
                  <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 leading-tight">Bem-vindo de volta,</h2>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight line-clamp-1">{userName}</h1>
                </div>
              </button>

              {/* Dark Mode Toggle Button */}
              <button
                onClick={toggleTheme}
                className="relative p-2.5 rounded-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all active:scale-95"
                aria-label="Alternar tema"
              >
                {isDark ? (
                  <Sun size={24} className="text-amber-400" />
                ) : (
                  <Moon size={24} className="text-slate-600" />
                )}
              </button>
            </header>

            {/* Live Class Action Card */}
            {liveClass ? (
              <section>
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-900 dark:to-black rounded-3xl p-5 text-white shadow-xl shadow-slate-900/20 relative overflow-hidden">
                  {/* Background decoration */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>

                  <div className="flex justify-between items-start relative z-10">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="flex h-2.5 w-2.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.5)]"></span>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Acontecendo Agora</span>
                      </div>
                      <h3 className="text-2xl font-bold mb-1 text-white">{liveClass.title}</h3>
                      <div className="flex items-center gap-2 text-slate-300 text-sm font-medium">
                        <Clock size={16} />
                        <span>{liveClass.time} - {liveClass.end_time}</span>
                        <span className="w-1 h-1 bg-slate-500 rounded-full"></span>
                        <span>{liveClass.location}</span>
                      </div>
                    </div>
                    <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/10 text-2xl">
                      {liveClass.modality === 'Judô' ? '🤼' : '🥋'}
                    </div>
                  </div>

                  <button
                    onClick={() => navigate('/attendance', { state: { sessionName: liveClass.title, sessionTime: `${liveClass.time} - ${liveClass.end_time}` } })}
                    className="w-full mt-5 bg-white text-slate-900 font-bold h-12 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 active:scale-[0.98] transition-all shadow-lg"
                  >
                    <PlayCircle size={20} className="text-primary" />
                    <span>Iniciar Aula</span>
                  </button>
                </div>
              </section>
            ) : upcomingClasses.length > 0 ? (
              // If no live class, highlight the next immediate one
              <section>
                <div className="bg-gradient-to-br from-primary to-secondary rounded-3xl p-5 text-white shadow-xl shadow-primary/20 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2 text-white/80">
                      <Calendar size={14} />
                      <span className="text-xs font-bold uppercase tracking-wider">Próxima Aula</span>
                    </div>
                    <h3 className="text-2xl font-bold mb-1">{upcomingClasses[0].title}</h3>
                    <div className="flex items-center gap-2 text-white/90 text-sm font-medium mb-4">
                      <Clock size={16} />
                      <span>{upcomingClasses[0].time} • {new Date(upcomingClasses[0].date).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'numeric' })}</span>
                      <span className="w-1 h-1 bg-white/50 rounded-full"></span>
                      <span>{upcomingClasses[0].location}</span>
                    </div>
                    <button
                      onClick={() => navigate('/attendance', { state: { sessionName: upcomingClasses[0].title, sessionTime: `${upcomingClasses[0].time} - ${upcomingClasses[0].end_time}` } })}
                      className="w-full bg-white text-primary font-bold h-11 rounded-xl flex items-center justify-center gap-2 hover:bg-white/90 active:scale-[0.98] transition-all"
                    >
                      Iniciar Aula
                    </button>
                  </div>
                </div>
              </section>
            ) : null}

            {/* Stats Grid */}
            <section className="grid grid-cols-2 gap-4">
              <div
                className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between h-40 cursor-pointer active:scale-95 transition-all"
                onClick={() => navigate('/students', { state: { filter: 'active' } })}
              >
                <div className="flex justify-between items-start">
                  <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                    <Users size={24} />
                  </div>
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold rounded-lg">100%</span>
                </div>
                <div>
                  <span className="text-3xl font-extrabold text-gray-900 dark:text-white">{stats?.activeStudents ?? 0}</span>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Alunos Ativos</p>
                </div>
              </div>

              <div
                className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between h-40 cursor-pointer active:scale-95 transition-all"
                onClick={() => navigate('/churn-risk')}
              >
                <div className="flex justify-between items-start">
                  <div className="p-2.5 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-600 dark:text-red-400">
                    <TrendingDown size={24} />
                  </div>
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold rounded-lg">Estável</span>
                </div>
                <div>
                  <span className="text-3xl font-extrabold text-gray-900 dark:text-white">{stats?.churnRisk ?? 0}</span>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 leading-tight">Risco de Evasão</p>
                </div>
              </div>
            </section>

            {/* Alerts */}
            <section className="flex flex-col gap-4">
              <div
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 flex items-center justify-between relative overflow-hidden cursor-pointer active:scale-[0.99] transition-all"
                onClick={() => navigate('/students', { state: { filter: 'payment_issue' } })}
              >
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${(stats?.overduePayments ?? 0) > 0 ? 'bg-red-500' : 'bg-accent'}`}></div>
                <div className="flex items-center gap-4 pl-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${(stats?.overduePayments ?? 0) > 0 ? 'bg-red-100 text-red-600' : 'bg-accent/10 text-accent'}`}>
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <h3 className={`text-base font-bold ${(stats?.overduePayments ?? 0) > 0 ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                      {stats?.overduePayments ?? 0} Pagamentos em Atraso
                    </h3>
                    <p className={`text-sm font-medium ${(stats?.overduePayments ?? 0) > 0 ? 'text-red-500' : 'text-accent'}`}>
                      {(stats?.overduePayments ?? 0) > 0 ? 'Requer atenção imediata' : 'Nenhuma ação necessária'}
                    </p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-200 text-xs font-bold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  Ver
                </button>
              </div>

              <div
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 flex items-center justify-between relative overflow-hidden cursor-pointer active:scale-[0.99] transition-all"
                onClick={() => navigate('/students')}
              >
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-yellow-500"></div>
                <div className="flex items-center gap-4 pl-3">
                  <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center text-yellow-600 dark:text-yellow-500">
                    <UserX size={24} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">{stats?.absentStudents ?? 0} Alunos Ausentes</h3>
                    <p className="text-sm font-medium text-yellow-600 dark:text-yellow-500">Sem presença esta semana</p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-200 text-xs font-bold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  Ver
                </button>
              </div>
            </section>

            {/* Advanced Revenue Chart */}
            <section className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 transition-colors">
              <div className="flex flex-col gap-4 mb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">Receita Realizada</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-gray-900 dark:text-white">R$ {(stats?.totalRealized ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-1">Diferença</span>
                    <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-500 rounded-lg">
                      <TrendingUp size={14} />
                      <span className="text-xs font-bold">-{difference}%</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-gray-200 dark:bg-gray-600 rounded-lg text-gray-500 dark:text-gray-300">
                      <DollarSign size={14} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 dark:text-gray-400 uppercase">Previsto (Se todos pagarem)</p>
                      <p className="text-sm font-bold text-gray-600 dark:text-gray-200">R$ {(stats?.totalPredicted ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                  <div className="w-12 h-12 relative flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="24" cy="24" r="18" stroke={isDark ? "#374151" : "#e5e7eb"} strokeWidth="4" fill="none" />
                      <circle cx="24" cy="24" r="18" stroke="#1dbac9" strokeWidth="4" fill="none" strokeDasharray="113" strokeDashoffset={113 - (113 * percentage) / 100} />
                    </svg>
                    <span className="absolute text-[10px] font-bold text-primary">{percentage}%</span>
                  </div>
                </div>
              </div>

              {/* Chart Container with explicit dimensions and no min-width hack */}
              <div ref={chartContainerRef} className="w-full mt-4 relative" style={{ height: '192px', minWidth: 0 }}>
                {chartReady ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRealized" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1dbac9" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#1dbac9" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} />

                      {/* Predicted Line (The Ceiling) - First child = payload[0] */}
                      <Line
                        type="monotone"
                        dataKey="predicted"
                        stroke="#9ca3af"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={{ r: 4, fill: isDark ? '#374151' : '#fff', stroke: '#9ca3af', strokeWidth: 2 }}
                        activeDot={{ r: 6 }}
                      />

                      {/* Realized Area (The Actual) - Second child = payload[1] */}
                      <Area
                        type="monotone"
                        dataKey="realized"
                        stroke="#1dbac9"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorRealized)"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full rounded-xl bg-gray-50 dark:bg-gray-800 animate-pulse flex items-center justify-center">
                    <div className="flex gap-2 items-end h-24">
                      <div className="w-3 bg-gray-200 dark:bg-gray-700 h-12 rounded-t-sm"></div>
                      <div className="w-3 bg-gray-200 dark:bg-gray-700 h-16 rounded-t-sm"></div>
                      <div className="w-3 bg-gray-200 dark:bg-gray-700 h-10 rounded-t-sm"></div>
                      <div className="w-3 bg-gray-200 dark:bg-gray-700 h-20 rounded-t-sm"></div>
                      <div className="w-3 bg-gray-200 dark:bg-gray-700 h-14 rounded-t-sm"></div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Upcoming Classes */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Próximas Aulas</h3>
                <button
                  onClick={() => navigate('/schedule')}
                  className="text-primary text-sm font-bold"
                >
                  Agenda
                </button>
              </div>

              <div className="flex flex-col gap-3">
                {upcomingClasses.length > 0 ? (
                  upcomingClasses.slice(0, 3).map((cls) => (
                    <div
                      key={cls.id}
                      onClick={() => navigate('/schedule')}
                      className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between cursor-pointer active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl text-lg font-bold ${cls.modality === 'Judô' ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400' : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                          }`}>
                          <span>{cls.modality === 'Judô' ? '🤼' : '🥋'}</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 dark:text-white">{cls.title}</h4>
                          <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">
                            <span>{new Date(cls.date).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'numeric' })}</span>
                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                            <span>{cls.time}</span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-gray-300" />
                    </div>
                  ))
                ) : (
                  /* Empty State for Classes */
                  <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col items-center justify-center text-center">
                    <p className="text-gray-400 font-medium">Nenhuma aula agendada</p>
                    <button onClick={() => navigate('/schedule')} className="text-primary text-sm font-bold mt-2">Criar Aula</button>
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </PullToRefresh>
  );
};