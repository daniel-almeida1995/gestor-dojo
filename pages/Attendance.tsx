import React, { useState, useEffect } from 'react';
import { CalendarCheck, Users, TrendingUp, ArrowLeft, Plus, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAttendance } from '../contexts/AttendanceContext';
import { CheckInModal } from '../components/CheckInModal';
import { getClassAttendance } from '../lib/attendance';

interface Class {
  id: string;
  title: string;
  date: string;
  time: string;
  modality: string;
  instructor: string;
  capacity: { current: number; max: number };
}

export const Attendance = () => {
  const navigate = useNavigate();
  const { todayClasses, loading, refreshTodayClasses } = useAttendance();
  const [selectedClass, setSelectedClass] = useState<any>(null); // Using any temporarily or matching context type
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [attendanceData, setAttendanceData] = useState<any>(null);

  const handleRegisterAttendance = async (classItem: any) => {
    setSelectedClass(classItem);

    // Carregar dados de presença da aula
    const attendance = await getClassAttendance(classItem.id);
    setAttendanceData(attendance);

    setShowCheckInModal(true);
  };

  const handleCheckInComplete = () => {
    setShowCheckInModal(false);
    setSelectedClass(null);
    refreshTodayClasses(); // Recarregar via contexto
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="flex items-center p-4 justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-10 h-10 flex items-center justify-center rounded-full active:bg-gray-200 transition-colors"
          >
            <ArrowLeft size={24} className="text-gray-900" />
          </button>
          <h2 className="text-xl font-bold text-gray-900">Presença</h2>
          <div className="w-10" />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-blue-50 p-3 rounded-xl text-center">
            <CalendarCheck size={20} className="mx-auto text-blue-600 mb-1" />
            <p className="text-2xl font-bold text-gray-900">{todayClasses.length}</p>
            <p className="text-xs text-gray-500">Aulas Hoje</p>
          </div>
          <div className="bg-green-50 p-3 rounded-xl text-center">
            <Users size={20} className="mx-auto text-green-600 mb-1" />
            <p className="text-2xl font-bold text-gray-900">
              {todayClasses.reduce((sum, c) => sum + (c.capacity?.current || 0), 0)}
            </p>
            <p className="text-xs text-gray-500">Presentes</p>
          </div>
          <div className="bg-purple-50 p-3 rounded-xl text-center">
            <TrendingUp size={20} className="mx-auto text-purple-600 mb-1" />
            <p className="text-2xl font-bold text-gray-900">
              {todayClasses.length > 0
                ? Math.round((todayClasses.reduce((sum, c) => sum + (c.capacity?.current || 0), 0) / (todayClasses.length * 20)) * 100)
                : 0}%
            </p>
            <p className="text-xs text-gray-500">Taxa Média</p>
          </div>
        </div>
      </div>

      {/* Classes List */}
      <div className="p-4 flex flex-col gap-3">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Aulas de Hoje</h3>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Carregando aulas...</p>
          </div>
        ) : todayClasses.length === 0 ? (
          <div className="text-center py-12">
            <CalendarCheck size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">Nenhuma aula agendada para hoje</p>
            <button
              onClick={() => navigate('/schedule')}
              className="mt-4 px-4 py-2 bg-secondary text-white rounded-xl font-bold text-sm"
            >
              Criar Aula
            </button>
          </div>
        ) : (
          todayClasses.map((classItem) => (
            <div
              key={classItem.id}
              className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-base font-bold text-gray-900">{classItem.title}</h4>
                  <p className="text-sm text-gray-500">{classItem.time} • {classItem.modality}</p>
                  {classItem.instructor && (
                    <p className="text-xs text-gray-400 mt-1">Instrutor: {classItem.instructor}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Presentes</p>
                  <p className="text-lg font-bold text-gray-900">
                    {classItem.capacity?.current || 0}/{classItem.capacity?.max || 20}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleRegisterAttendance(classItem)}
                className="w-full py-3 bg-secondary text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-secondary/90 transition-colors"
              >
                <CalendarCheck size={18} />
                Registrar Presença
              </button>
            </div>
          ))
        )}
      </div>

      {/* Check-in Modal */}
      {showCheckInModal && selectedClass && (
        <CheckInModal
          classItem={selectedClass}
          attendanceData={attendanceData}
          onClose={() => setShowCheckInModal(false)}
          onComplete={handleCheckInComplete}
        />
      )}
    </div>
  );
};