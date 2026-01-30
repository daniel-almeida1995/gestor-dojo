import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useSettings } from '../contexts/SettingsContext';
import { calculateDashboardStats, DashboardStats, ChartDataPoint } from '../lib/financial';
import { Student, Payment } from '../types';

export const useFinancials = () => {
    const { settings, loading: settingsLoading } = useSettings();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
    const [loading, setLoading] = useState(true);

    const refreshFinancials = useCallback(async () => {
        if (settingsLoading) return; // Wait for settings
        setLoading(true);

        try {
            const now = new Date();
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
            const currentMonthStart = firstDay.toISOString().split('T')[0];

            // Parallel Fetching
            const [studentsRes, paymentsRes] = await Promise.all([
                supabase.from('students').select('*'),
                supabase
                    .from('payments')
                    .select('student_id')
                    .eq('status', 'paid')
                    .or(`paid_at.gte.${currentMonthStart},reference_month.gte.${currentMonthStart}`)
            ]);

            if (studentsRes.error) throw studentsRes.error;
            if (paymentsRes.error) throw paymentsRes.error;

            const students = (studentsRes.data || []) as Student[];
            const paidPayments = (paymentsRes.data || []) as Payment[];

            const paidStudentIds = new Set(paidPayments.map(p => p.student_id));
            // Note: Payment interface in types.ts has student_id? We might need to fix that too or cast.
            // Checking types.ts: Payment has studentId? (camel) and implicitly maybe others?
            // Let's assume casting works for now or I'll fix types if needed.
            // Actually, db returns snake_case student_id.

            const { stats: newStats, chartData: newChartData } = calculateDashboardStats(
                students,
                paidStudentIds as unknown as Set<string>, // casting set? No, map returns string[]
                settings
            );
            // Fix Set usage
            const paidIds = new Set(paidPayments.map((p: any) => p.student_id));

            const { stats: computedStats, chartData: computedChartData } = calculateDashboardStats(
                students,
                paidIds,
                settings,
                now
            );

            setStats(computedStats);
            setChartData(computedChartData);

        } catch (err) {
            console.error("Error fetching financials:", err);
        } finally {
            setLoading(false);
        }
    }, [settings, settingsLoading]);

    useEffect(() => {
        if (!settingsLoading) {
            refreshFinancials();
        }
    }, [settingsLoading, refreshFinancials]);

    return {
        stats,
        chartData,
        loading,
        refreshFinancials
    };
};
