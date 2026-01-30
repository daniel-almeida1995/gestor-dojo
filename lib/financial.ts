import { Student, Payment, OrganizationSettings } from '../types';

export interface DashboardStats {
    activeStudents: number;
    overduePayments: number;
    churnRisk: number;
    absentStudents: number;
    totalPredicted: number;
    totalRealized: number;
}

export interface ChartDataPoint {
    name: string;
    range: [number, number];
    predicted: number;
    realized: number;
}

export const isStudentOverdue = (
    student: Student,
    hasPaidThisMonth: boolean,
    settings: OrganizationSettings | null,
    currentDay: number = new Date().getDate()
): boolean => {
    if (student.status === 'inactive') return false;
    if (hasPaidThisMonth) return false;

    const dueDay = student.dueDay || settings?.default_due_day || 10;

    // If explicitly marked as payment issue, or if today is past due day
    const isLateByDate = currentDay > dueDay;
    const isMarkedLate = student.status === 'payment_issue';

    return isLateByDate || isMarkedLate;
};

export const calculateDashboardStats = (
    students: Student[],
    paidStudentIds: Set<string>,
    settings: OrganizationSettings | null,
    referenceDate: Date = new Date() // Allow injection for testing
): { stats: DashboardStats; chartData: ChartDataPoint[] } => {

    const currentDay = referenceDate.getDate();
    const defaultFee = settings?.default_monthly_fee || 150.00;
    const defaultDueDay = settings?.default_due_day || 10;

    // Initialize Stats
    let activeCount = 0;
    let overdueCount = 0;
    let predictedTotal = 0;
    let overdueAmount = 0;

    // Initialize Weeks Buckets for Chart
    const weeks: ChartDataPoint[] = [
        { name: 'Sem 1', range: [1, 7], predicted: 0, realized: 0 },
        { name: 'Sem 2', range: [8, 14], predicted: 0, realized: 0 },
        { name: 'Sem 3', range: [15, 21], predicted: 0, realized: 0 },
        { name: 'Sem 4', range: [22, 31], predicted: 0, realized: 0 },
    ];

    students.forEach(s => {
        const fee = s.monthlyFee || defaultFee;
        const dueDay = s.dueDay || defaultDueDay;
        const isPaid = paidStudentIds.has(s.id);

        // 1. Count Active Students
        if (s.status === 'active') {
            activeCount++;
        }

        // 2. Financial Calculations (Active or Issue)
        if (s.status === 'active' || s.status === 'payment_issue') {
            predictedTotal += fee;

            // Add to chart bucket based on due day (Predicted)
            const week = weeks.find(w => dueDay >= w.range[0] && dueDay <= w.range[1]);
            if (week) week.predicted += fee;
        }

        // 3. Overdue Check
        if (isStudentOverdue(s, isPaid, settings, currentDay)) {
            overdueCount++;
            overdueAmount += fee;
        } else {
            // If not overdue (Paid OR Not yet due), count as Realized 
            // BUT only if actually paid OR if strictly active (logic from original dashboard was generous)
            // Original logic: "if active or paid, realized++" but "if overdue, realized--"

            if (s.status === 'active' || isPaid) {
                const week = weeks.find(w => dueDay >= w.range[0] && dueDay <= w.range[1]);
                // Note: The original logic added to realized if active, then subtracted if overdue.
                // Here we can be more direct.
                if (week && (isPaid || (!isStudentOverdue(s, isPaid, settings, currentDay)))) {
                    week.realized += fee;
                }
            }
        }
    });

    // Re-verify logic consistency with original:
    // Realized = Predicted - Overdue (simplified)
    // Ensure no negative realized
    const realizedTotal = Math.max(0, predictedTotal - overdueAmount);

    // Fix chart realized values to match total realized roughly
    // The per-week realized logic above is optimistic.
    // A strictly correct chart need checks per week. 
    // For V1 refactor, we keep it consistent with the overall total.

    weeks.forEach(w => {
        // If realized > predicted for that week (e.g. late payments from prev months?), clamp?
        // For now leave as calculated.
        w.realized = Math.max(0, w.realized);
        // If we want realized to NOT include "not yet paid but not overdue", we should change logic.
        // But original dashboard treated "Not Overdue" as "Realized" visually? 
        // Wait, original: "if (active || isPaid) realized += fee". THEN "if (overdue) realized -= fee".
        // Meaning: Everyone active is "Potentially Realized". Overdue removes from it.
        // So "Future Due" counts as Realized in the graph until it becomes Overdue.
        // That is weird accounting, but I will preserve behavior for now to avoid breaking UI expectations.
        // Actually, let's fix it slightly: Realized should ideally be PAID.
        // But if the requirement is "Refactor", I shouldn't change business definitions without asking.
        // However, "Integridade Financeira" was a risk.
        // I will stick to: Realized = Paid + (Active AND Not Overdue)
        // This matches "Forecast" style usually.

        // We need to apply the overdue subtraction to the chart buckets too
        // My loop above: `if (week && (isPaid || (!isOverdue))) week.realized += fee;` 
        // This correctly adds ONLY if NOT overdue. So subtraction isn't needed.
        // This is cleaner than original.
    });

    return {
        stats: {
            activeStudents: activeCount,
            overduePayments: overdueCount,
            churnRisk: 0, // Placeholder as per original
            absentStudents: 0, // Placeholder
            totalPredicted: predictedTotal,
            totalRealized: realizedTotal
        },
        chartData: weeks
    };
};
