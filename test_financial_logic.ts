
import { calculateDashboardStats } from './lib/financial';
import { Student } from './types';

// Mock Data
const mockSettings: any = {
    id: 'test-org',
    school_name: 'Dojo Test',
    currency_symbol: 'R$',
    default_monthly_fee: 150,
    default_due_day: 10,
    user_id: 'test',
    organization_name: 'Dojo Test'
};

const mockStudents: Student[] = [
    {
        id: '1',
        name: 'Alice (Paid)',
        status: 'active',
        monthlyFee: 200,
        dueDay: 5,
        belt: 'White',
        beltColor: 'white',
        phone: '',
        modality: 'Jiu-Jitsu',
        avatar: ''
    },
    {
        id: '2',
        name: 'Bob (Active, Not Paid yet, Not Overdue)',
        status: 'active',
        monthlyFee: 150,
        dueDay: 25, // Future due date
        belt: 'Blue',
        beltColor: 'blue',
        phone: '',
        modality: 'Jiu-Jitsu',
        avatar: ''
    },
    {
        id: '3',
        name: 'Charlie (Overdue)',
        status: 'payment_issue', // Explicitly overdue
        monthlyFee: 150,
        dueDay: 5,
        belt: 'White',
        beltColor: 'white',
        phone: '',
        modality: 'Jiu-Jitsu',
        avatar: ''
    },
    {
        id: '4',
        name: 'David (Inactive)',
        status: 'inactive',
        monthlyFee: 100,
        dueDay: 10,
        belt: 'White',
        beltColor: 'white',
        phone: '',
        modality: 'Jiu-Jitsu',
        avatar: ''
    }
];

const paidStudentIds = new Set(['1']);

console.log("--- Testing Financial Logic ---");

// Assume today is the 15th
const testDate = new Date('2024-02-15T12:00:00Z');
console.log("Reference Date:", testDate.toISOString());

const { stats } = calculateDashboardStats(mockStudents, paidStudentIds, mockSettings, testDate);

console.log("Stats Result:", stats);

// Validation
// Total Predicted: Alice (200) + Bob (150) + Charlie (150) = 500. (David is inactive, excluded).
// Overdue: Charlie is 'payment_issue'. Alice paid. Bob is active but due day 25 (future).
// Wait, 'isStudentOverdue' checks: 
// 1. Inactive -> false
// 2. Paid -> false
// 3. Due Day < Current Day? OR status == 'payment_issue'.
// Charlie: status 'payment_issue' -> Overdue. Fee: 150.
// Bob: status 'active', not paid. Due Day 25. Current 15. 15 > 25? False. Not overdue.
// Alice: status 'active', Paid. Not overdue.

// Overdue Amount: 150 (Charlie).
// Realized: 
// Logic in file: `if (active || isPaid)`. Then if NOT overdue, add to realized.
// Alice: Active + Paid. Overdue? No. Add 200.
// Bob: Active + Not Paid. Overdue? No (Due 25). Add 150. (Optimistic Realized)
// Charlie: Active? No (payment_issue). Paid? No. Overdue? Yes. Realized = 0.

// Expected Realized: 350.
// Expected Predicted: 500.

if (stats.totalPredicted === 500) {
    console.log("✅ Total Predicted Correct (500)");
} else {
    console.error("❌ Total Predicted Failed. Expected 500, got", stats.totalPredicted);
}

if (stats.overduePayments === 1) { // Count of students overdue
    console.log("✅ Overdue Count Correct (1)");
} else {
    console.error("❌ Overdue Count Failed. Expected 1, got", stats.overduePayments);
}

// Check Optimistic Realized
if (stats.totalRealized === 350) {
    console.log("✅ Total Realized Correct (350) - Logic is Optimistic (Includes future due)");
} else {
    console.error("❌ Total Realized Failed. Expected 350, got", stats.totalRealized);
}
