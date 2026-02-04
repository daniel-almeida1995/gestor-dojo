import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { Building2, Save, ArrowLeft, DollarSign, Calendar } from 'lucide-react';

export const Settings = () => {
    const { settings, updateSettings, loading } = useSettings();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        school_name: '',
        default_monthly_fee: 150.00,
        default_due_day: 10,
        currency_symbol: 'R$',
    });

    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (settings) {
            setFormData({
                school_name: settings.school_name || '',
                default_monthly_fee: settings.default_monthly_fee || 150.00,
                default_due_day: settings.default_due_day || 10,
                currency_symbol: settings.currency_symbol || 'R$',
            });
        }
    }, [settings]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await updateSettings(formData);
            // Show success feedback?
            navigate('/dashboard');
        } catch (error: any) {
            console.error(error);
            alert(`Erro ao salvar: ${error.message || JSON.stringify(error)}`);
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
    }

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 pb-20">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 sticky top-0 z-10">
                <div className="flex items-center justify-between px-5 py-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 -ml-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-full transition-colors"
                    >
                        <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
                    </button>
                    <h1 className="text-lg font-bold text-gray-900 dark:text-white">Configurar Dojô</h1>
                    <div className="w-10"></div>
                </div>
            </header>

            <main className="p-5">
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">

                    <section className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                        <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase mb-4 flex items-center gap-2">
                            <Building2 size={16} /> Identidade
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome da Escola</label>
                                <input
                                    type="text"
                                    value={formData.school_name}
                                    onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                    placeholder="Ex: Dojo Cobra Kai"
                                    required
                                />
                            </div>
                        </div>
                    </section>

                    <section className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                        <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase mb-4 flex items-center gap-2">
                            <DollarSign size={16} /> Financeiro Padrão
                        </h2>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mensalidade (R$)</label>
                                    <input
                                        type="number"
                                        value={formData.default_monthly_fee}
                                        onChange={(e) => setFormData({ ...formData, default_monthly_fee: parseFloat(e.target.value) })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                        placeholder="150.00"
                                        step="0.01"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dia Vencimento</label>
                                    <input
                                        type="number"
                                        value={formData.default_due_day}
                                        onChange={(e) => setFormData({ ...formData, default_due_day: parseInt(e.target.value) })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                        placeholder="10"
                                        min="1"
                                        max="31"
                                        required
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-gray-500">
                                Estes valores serão usados como padrão para novos alunos. Você poderá alterar individualmente depois.
                            </p>
                        </div>
                    </section>

                    <button
                        type="submit"
                        disabled={isSaving}
                        className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/30 flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-70"
                    >
                        {isSaving ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <Save size={20} />
                                <span>Salvar Alterações</span>
                            </>
                        )}
                    </button>

                </form>
            </main>
        </div>
    );
};
