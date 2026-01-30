
import { supabase } from './lib/supabase';

async function testSchema() {
    console.log("Starting Schema Verification...");

    try {
        // 1. Test Students Table
        console.log("Testing 'students' table...");
        const { data: students, error: studentsError } = await supabase
            .from('students')
            .select('id, name')
            .limit(1);

        if (studentsError) {
            console.error("❌ Error accessing 'students':", studentsError.message);
        } else {
            console.log("✅ 'students' table is accessible. Found rows:", students?.length);
        }

        // 2. Test Classes Table
        console.log("Testing 'classes' table...");
        const { data: classes, error: classesError } = await supabase
            .from('classes')
            .select('id, title')
            .limit(1);

        if (classesError) {
            console.error("❌ Error accessing 'classes':", classesError.message);
        } else {
            console.log("✅ 'classes' table is accessible. Found rows:", classes?.length);
        }

        // 3. Test Attendance Records (The new one)
        console.log("Testing 'attendance_records' table...");
        const { data: attendance, error: attendanceError } = await supabase
            .from('attendance_records')
            .select('id')
            .limit(1);

        if (attendanceError) {
            console.error("❌ Error accessing 'attendance_records':", attendanceError.message);
        } else {
            console.log("✅ 'attendance_records' table is accessible. Found rows:", attendance?.length);
        }

    } catch (err) {
        console.error("Unexpected error:", err);
    }
}

testSchema();
