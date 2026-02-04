
-- Enable RLS
alter table organization_settings enable row level security;

-- Drop generic policies if they exist (to avoid conflicts)
drop policy if exists "Enable read access for all users" on organization_settings;
drop policy if exists "Enable insert for authenticated users only" on organization_settings;
drop policy if exists "Enable update for users based on email" on organization_settings;
drop policy if exists "Users can view their own settings" on organization_settings;
drop policy if exists "Users can insert their own settings" on organization_settings;
drop policy if exists "Users can update their own settings" on organization_settings;

-- Create a comprehensive policy
create policy "Users can manage their own settings"
on organization_settings
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
