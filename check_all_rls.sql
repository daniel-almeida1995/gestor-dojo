
SELECT 
    t.tablename,
    t.rowsecurity as rls_enabled,
    (SELECT count(*) FROM pg_policies p WHERE p.tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE schemaname = 'public';
