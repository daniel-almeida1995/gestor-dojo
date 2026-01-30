-- Execute esses comandos no Editor SQL do seu painel Supabase

-- 1. Tabela de Alunos
create table if not exists students (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  name text not null,
  phone text,
  modality text,
  belt text,
  belt_color text,
  status text default 'active',
  avatar text,
  degrees int default 0,
  classes_attended int default 0,
  history jsonb default '[]'::jsonb,
  due_day int default 10,
  monthly_fee numeric default 150.00,
  last_payment_date timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Atualização para tabela existente (caso já tenha criado)
alter table students add column if not exists due_day int default 10;
alter table students add column if not exists monthly_fee numeric default 150.00;
alter table students add column if not exists last_payment_date timestamp with time zone;

-- 2. Tabela de Aulas
create table if not exists classes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  title text not null,
  date date not null,
  time text not null,
  end_time text not null,
  modality text,
  instructor text,
  location text,
  status text default 'upcoming',
  capacity jsonb default '{"current": 0, "max": 20}'::jsonb,
  observations text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. Tabela de Pagamentos
-- Nota: Esta definição inclui as colunas solicitadas para compatibilidade
create table if not exists payments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  student_id uuid references students(id) on delete cascade not null,
  reference_month date, -- Utilizado para agrupar e identificar a competência
  amount numeric not null,
  status text check (status in ('paid', 'pending', 'overdue')) default 'pending',
  payment_method text,
  paid_at timestamp with time zone,
  
  -- Colunas legadas ou alternativas que podem existir
  description text,
  date timestamp with time zone, 
  type text check (type in ('tuition', 'product', 'seminar')) default 'tuition',
  
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Se a tabela já existe, adicionar as colunas novas
alter table payments add column if not exists reference_month date;
alter table payments add column if not exists paid_at timestamp with time zone;
alter table payments add column if not exists payment_method text;

-- 4. Habilitar Segurança (RLS)
alter table students enable row level security;
alter table classes enable row level security;
alter table payments enable row level security;

-- 5. Criar Políticas de Acesso
create policy "Usuários gerenciam seus próprios alunos"
on students for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Usuários gerenciam suas próprias aulas"
on classes for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Usuários gerenciam seus próprios pagamentos"
on payments for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- 6. Recarregar Cache do Schema (Importante para evitar erros de cache)
NOTIFY pgrst, 'reload config';

-- 7. Tabela de Configurações da Organização (Tenant Settings)
create table if not exists organization_settings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null unique, -- 1:1 com usuário/dono
  school_name text default 'Minha Escola',
  logo_url text,
  default_monthly_fee numeric default 150.00,
  default_due_day int default 10,
  currency_symbol text default 'R$',
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Habilitar RLS para Settings
alter table organization_settings enable row level security;

-- Políticas de Acesso para Settings
create policy "Usuários gerenciam suas próprias configurações"
on organization_settings for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);