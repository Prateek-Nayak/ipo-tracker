-- Run this in the Supabase SQL editor once.
--
-- Deleted records are now kept instead of removed, and sync as a fourth kind
-- alongside accounts, ipos and transfers. The original table only accepted the
-- three, so a sync carrying deleted records is rejected outright.
--
-- Safe to re-run: it only widens what `kind` accepts, and touches no data.

alter table public.user_data drop constraint if exists user_data_kind_check;

alter table public.user_data add constraint user_data_kind_check
  check (kind in ('accounts','ipos','transfers','trash'));
