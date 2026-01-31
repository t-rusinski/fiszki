-- =====================================================
-- migration: disable_rls_policies
-- description: disables all row level security policies for flashcards,
--              generations, and generation_error_logs tables
-- affected tables: flashcards, generations, generation_error_logs
-- author: ai-assisted migration
-- date: 2025-12-15
-- notes:
--   - drops all policies created in initial_schema migration
--   - disables rls on all three tables
--   - warning: this removes data isolation between users
-- =====================================================

-- =====================================================
-- drop rls policies for generations table
-- =====================================================

-- drop select policies
drop policy if exists "generations_select_authenticated" on generations;
drop policy if exists "generations_select_anon" on generations;

-- drop insert policies
drop policy if exists "generations_insert_authenticated" on generations;
drop policy if exists "generations_insert_anon" on generations;

-- drop update policies
drop policy if exists "generations_update_authenticated" on generations;
drop policy if exists "generations_update_anon" on generations;

-- drop delete policies
drop policy if exists "generations_delete_authenticated" on generations;
drop policy if exists "generations_delete_anon" on generations;

-- =====================================================
-- drop rls policies for generation_error_logs table
-- =====================================================

-- drop select policies
drop policy if exists "generation_error_logs_select_authenticated" on generation_error_logs;
drop policy if exists "generation_error_logs_select_anon" on generation_error_logs;

-- drop insert policies
drop policy if exists "generation_error_logs_insert_authenticated" on generation_error_logs;
drop policy if exists "generation_error_logs_insert_anon" on generation_error_logs;

-- drop update policies
drop policy if exists "generation_error_logs_update_authenticated" on generation_error_logs;
drop policy if exists "generation_error_logs_update_anon" on generation_error_logs;

-- drop delete policies
drop policy if exists "generation_error_logs_delete_authenticated" on generation_error_logs;
drop policy if exists "generation_error_logs_delete_anon" on generation_error_logs;

-- =====================================================
-- drop rls policies for flashcards table
-- =====================================================

-- drop select policies
drop policy if exists "flashcards_select_authenticated" on flashcards;
drop policy if exists "flashcards_select_anon" on flashcards;

-- drop insert policies
drop policy if exists "flashcards_insert_authenticated" on flashcards;
drop policy if exists "flashcards_insert_anon" on flashcards;

-- drop update policies
drop policy if exists "flashcards_update_authenticated" on flashcards;
drop policy if exists "flashcards_update_anon" on flashcards;

-- drop delete policies
drop policy if exists "flashcards_delete_authenticated" on flashcards;
drop policy if exists "flashcards_delete_anon" on flashcards;

-- =====================================================
-- disable row level security on all tables
-- description: completely disables rls enforcement
-- warning: all users will have access to all rows
-- =====================================================

alter table generations disable row level security;
alter table generation_error_logs disable row level security;
alter table flashcards disable row level security;

-- =====================================================
-- migration complete
-- note: data isolation between users is now removed
--       application-level authorization must be implemented
-- =====================================================
