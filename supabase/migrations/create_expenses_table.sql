create table expenses (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  platform text not null check (platform in ('whatsapp', 'telegram')),
  message text not null,
  amount integer not null,
  category text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for better query performance
create index expenses_user_id_platform_idx on expenses(user_id, platform);
create index expenses_created_at_idx on expenses(created_at);

-- Enable Row Level Security (RLS)
alter table expenses enable row level security;

-- Create a policy that allows all operations (for now)
create policy "Enable all operations for authenticated users"
  on expenses for all
  using (true)
  with check (true); 