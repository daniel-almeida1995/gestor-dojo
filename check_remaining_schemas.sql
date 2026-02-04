
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('classes', 'attendance_records', 'students')
ORDER BY table_name, ordinal_position;
