-- Publish task changes to authenticated clients so tabs and devices stay in sync.
do $$
begin
  alter publication supabase_realtime add table public.tasks;
exception
  when duplicate_object then null;
end $$;

-- Include full rows in delete events so clients can reconcile them safely.
alter table public.tasks replica identity full;
