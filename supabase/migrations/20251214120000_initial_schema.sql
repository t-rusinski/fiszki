-- =====================================================
-- migration: initial_schema
-- description: creates generations, generation_error_logs, and flashcards tables
--              with row level security policies and indexes
-- affected tables: generations, generation_error_logs, flashcards
-- author: ai-assisted migration
-- date: 2025-12-14
-- notes:
--   - assumes auth.users table exists (managed by supabase auth)
--   - implements granular rls policies for authenticated users
--   - adds trigger for automatic updated_at timestamp updates
--   - tables created in dependency order: generations first, then flashcards
-- =====================================================

-- =====================================================
-- table: generations
-- description: tracks ai generation sessions including model used,
--              counts of generated/accepted cards, and performance metrics
-- note: created first as flashcards table references this table
-- =====================================================
create table generations (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  model varchar not null,
  generated_count integer not null,
  accepted_unedited_count integer,
  accepted_edited_count integer,
  source_text_hash varchar not null,
  source_text_length integer not null check (source_text_length between 1000 and 10000),
  generation_duration integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- add comment to table
comment on table generations is 'tracks ai flashcard generation sessions with metrics and source text info';
comment on column generations.model is 'ai model used for generation (e.g., gpt-4, claude-3)';
comment on column generations.generated_count is 'total number of flashcards generated in this session';
comment on column generations.accepted_unedited_count is 'count of ai-generated cards accepted without editing';
comment on column generations.accepted_edited_count is 'count of ai-generated cards accepted after editing';
comment on column generations.source_text_hash is 'hash of source text to prevent duplicate generations';
comment on column generations.source_text_length is 'character count of source text (1000-10000 chars)';
comment on column generations.generation_duration is 'time taken for generation in milliseconds';

-- =====================================================
-- table: generation_error_logs
-- description: logs errors during ai generation attempts
--              for debugging and monitoring purposes
-- =====================================================
create table generation_error_logs (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  model varchar not null,
  source_text_hash varchar not null,
  source_text_length integer not null check (source_text_length between 1000 and 10000),
  error_code varchar(100) not null,
  error_message text not null,
  created_at timestamptz not null default now()
);

-- add comment to table
comment on table generation_error_logs is 'logs ai generation errors for monitoring and debugging';
comment on column generation_error_logs.error_code is 'standardized error code (e.g., api_error, timeout, rate_limit)';
comment on column generation_error_logs.error_message is 'detailed error message from ai provider or system';

-- =====================================================
-- table: flashcards
-- description: stores user-created flashcards with front/back content
--              tracks source (ai-full, ai-edited, or manual)
--              optional reference to generation session
-- note: created after generations table due to foreign key dependency
-- =====================================================
create table flashcards (
  id bigserial primary key,
  front varchar(200) not null,
  back varchar(500) not null,
  source varchar not null check (source in ('ai-full', 'ai-edited', 'manual')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  generation_id bigint references generations(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade
);

-- add comment to table
comment on table flashcards is 'user flashcards with front/back content and ai generation tracking';
comment on column flashcards.source is 'origin of flashcard: ai-full (unedited ai), ai-edited (edited ai), or manual';
comment on column flashcards.generation_id is 'optional reference to ai generation session that created this flashcard';

-- =====================================================
-- indexes for performance
-- description: add indexes on foreign keys and frequently queried columns
-- =====================================================

-- generations indexes
create index idx_generations_user_id on generations(user_id);

-- generation_error_logs indexes
create index idx_generation_error_logs_user_id on generation_error_logs(user_id);

-- flashcards indexes
create index idx_flashcards_user_id on flashcards(user_id);
create index idx_flashcards_generation_id on flashcards(generation_id);

-- =====================================================
-- trigger function: update_updated_at_column
-- description: automatically updates updated_at timestamp on row modification
-- usage: attach to tables that need automatic timestamp tracking
-- =====================================================
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- =====================================================
-- triggers for automatic updated_at updates
-- =====================================================

-- trigger for generations table
create trigger set_generations_updated_at
  before update on generations
  for each row
  execute function update_updated_at_column();

comment on trigger set_generations_updated_at on generations is 'automatically updates updated_at timestamp on generation record modifications';

-- trigger for flashcards table
create trigger set_flashcards_updated_at
  before update on flashcards
  for each row
  execute function update_updated_at_column();

comment on trigger set_flashcards_updated_at on flashcards is 'automatically updates updated_at timestamp on flashcard modifications';

-- =====================================================
-- row level security (rls) setup
-- description: enable rls on all tables to ensure data isolation
-- note: even if table is public, rls must be enabled as best practice
-- =====================================================

-- enable rls on all tables
alter table generations enable row level security;
alter table generation_error_logs enable row level security;
alter table flashcards enable row level security;

-- =====================================================
-- rls policies for generations table
-- description: users can only access their own generation records
-- =====================================================

-- select policy for authenticated users
create policy "generations_select_authenticated"
  on generations
  for select
  to authenticated
  using (auth.uid() = user_id);

comment on policy "generations_select_authenticated" on generations is
  'authenticated users can view only their own generation records';

-- select policy for anonymous users (denied)
create policy "generations_select_anon"
  on generations
  for select
  to anon
  using (false);

comment on policy "generations_select_anon" on generations is
  'anonymous users cannot view generation records';

-- insert policy for authenticated users
create policy "generations_insert_authenticated"
  on generations
  for insert
  to authenticated
  with check (auth.uid() = user_id);

comment on policy "generations_insert_authenticated" on generations is
  'authenticated users can create generation records with their own user_id';

-- insert policy for anonymous users (denied)
create policy "generations_insert_anon"
  on generations
  for insert
  to anon
  with check (false);

comment on policy "generations_insert_anon" on generations is
  'anonymous users cannot create generation records';

-- update policy for authenticated users
create policy "generations_update_authenticated"
  on generations
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

comment on policy "generations_update_authenticated" on generations is
  'authenticated users can update only their own generation records';

-- update policy for anonymous users (denied)
create policy "generations_update_anon"
  on generations
  for update
  to anon
  using (false)
  with check (false);

comment on policy "generations_update_anon" on generations is
  'anonymous users cannot update generation records';

-- delete policy for authenticated users
create policy "generations_delete_authenticated"
  on generations
  for delete
  to authenticated
  using (auth.uid() = user_id);

comment on policy "generations_delete_authenticated" on generations is
  'authenticated users can delete only their own generation records';

-- delete policy for anonymous users (denied)
create policy "generations_delete_anon"
  on generations
  for delete
  to anon
  using (false);

comment on policy "generations_delete_anon" on generations is
  'anonymous users cannot delete generation records';

-- =====================================================
-- rls policies for generation_error_logs table
-- description: users can only access their own error logs
-- note: typically only insert and select are needed for logs
-- =====================================================

-- select policy for authenticated users
create policy "generation_error_logs_select_authenticated"
  on generation_error_logs
  for select
  to authenticated
  using (auth.uid() = user_id);

comment on policy "generation_error_logs_select_authenticated" on generation_error_logs is
  'authenticated users can view only their own error logs';

-- select policy for anonymous users (denied)
create policy "generation_error_logs_select_anon"
  on generation_error_logs
  for select
  to anon
  using (false);

comment on policy "generation_error_logs_select_anon" on generation_error_logs is
  'anonymous users cannot view error logs';

-- insert policy for authenticated users
create policy "generation_error_logs_insert_authenticated"
  on generation_error_logs
  for insert
  to authenticated
  with check (auth.uid() = user_id);

comment on policy "generation_error_logs_insert_authenticated" on generation_error_logs is
  'authenticated users can create error logs with their own user_id';

-- insert policy for anonymous users (denied)
create policy "generation_error_logs_insert_anon"
  on generation_error_logs
  for insert
  to anon
  with check (false);

comment on policy "generation_error_logs_insert_anon" on generation_error_logs is
  'anonymous users cannot create error logs';

-- update policy for authenticated users (typically logs should not be updated)
create policy "generation_error_logs_update_authenticated"
  on generation_error_logs
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

comment on policy "generation_error_logs_update_authenticated" on generation_error_logs is
  'authenticated users can update only their own error logs (rarely needed)';

-- update policy for anonymous users (denied)
create policy "generation_error_logs_update_anon"
  on generation_error_logs
  for update
  to anon
  using (false)
  with check (false);

comment on policy "generation_error_logs_update_anon" on generation_error_logs is
  'anonymous users cannot update error logs';

-- delete policy for authenticated users
create policy "generation_error_logs_delete_authenticated"
  on generation_error_logs
  for delete
  to authenticated
  using (auth.uid() = user_id);

comment on policy "generation_error_logs_delete_authenticated" on generation_error_logs is
  'authenticated users can delete only their own error logs';

-- delete policy for anonymous users (denied)
create policy "generation_error_logs_delete_anon"
  on generation_error_logs
  for delete
  to anon
  using (false);

comment on policy "generation_error_logs_delete_anon" on generation_error_logs is
  'anonymous users cannot delete error logs';

-- =====================================================
-- rls policies for flashcards table
-- description: users can only access their own flashcards
-- policies: separate policies for each operation (select, insert, update, delete)
--           and each role (anon, authenticated)
-- rationale: granular policies allow fine-grained access control
-- =====================================================

-- select policy for authenticated users
create policy "flashcards_select_authenticated"
  on flashcards
  for select
  to authenticated
  using (auth.uid() = user_id);

comment on policy "flashcards_select_authenticated" on flashcards is
  'authenticated users can view only their own flashcards';

-- select policy for anonymous users (denied)
create policy "flashcards_select_anon"
  on flashcards
  for select
  to anon
  using (false);

comment on policy "flashcards_select_anon" on flashcards is
  'anonymous users cannot view flashcards';

-- insert policy for authenticated users
create policy "flashcards_insert_authenticated"
  on flashcards
  for insert
  to authenticated
  with check (auth.uid() = user_id);

comment on policy "flashcards_insert_authenticated" on flashcards is
  'authenticated users can create flashcards with their own user_id';

-- insert policy for anonymous users (denied)
create policy "flashcards_insert_anon"
  on flashcards
  for insert
  to anon
  with check (false);

comment on policy "flashcards_insert_anon" on flashcards is
  'anonymous users cannot create flashcards';

-- update policy for authenticated users
create policy "flashcards_update_authenticated"
  on flashcards
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

comment on policy "flashcards_update_authenticated" on flashcards is
  'authenticated users can update only their own flashcards';

-- update policy for anonymous users (denied)
create policy "flashcards_update_anon"
  on flashcards
  for update
  to anon
  using (false)
  with check (false);

comment on policy "flashcards_update_anon" on flashcards is
  'anonymous users cannot update flashcards';

-- delete policy for authenticated users
create policy "flashcards_delete_authenticated"
  on flashcards
  for delete
  to authenticated
  using (auth.uid() = user_id);

comment on policy "flashcards_delete_authenticated" on flashcards is
  'authenticated users can delete only their own flashcards';

-- delete policy for anonymous users (denied)
create policy "flashcards_delete_anon"
  on flashcards
  for delete
  to anon
  using (false);

comment on policy "flashcards_delete_anon" on flashcards is
  'anonymous users cannot delete flashcards';
