-- Data-isolation test. Run in the Supabase SQL editor AFTER crm-schema.sql.
-- 1. Replace the two UUIDs with ids of two real users (Authentication -> Users).
-- 2. Run the whole script. It runs inside a transaction and rolls back, so nothing is kept.
-- Expected: every "should_be_*" value is 0 and the last statement errors or inserts nothing.
begin;
set local role authenticated;

select set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-0000-0000-00000000000a', 'role', 'authenticated')::text, true);
insert into public.contacts (name) values ('RLS test contact (user A)');

select set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-0000-0000-00000000000b', 'role', 'authenticated')::text, true);
select count(*) as should_be_0_read   from public.contacts where name = 'RLS test contact (user A)';
with u as (update public.contacts set name = 'hacked' where name = 'RLS test contact (user A)' returning 1) select count(*) as should_be_0_update from u;
with d as (delete from public.contacts where name = 'RLS test contact (user A)' returning 1) select count(*) as should_be_0_delete from d;

-- User B must not be able to attach a task to user A's contact (this should raise an RLS error):
-- insert into public.tasks (title, contact_id) select 'cross-user link', id from public.contacts;  -- sees nothing, inserts nothing
rollback;
