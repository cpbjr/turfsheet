-- Create a new public storage bucket for maintenance photos
insert into storage.buckets (id, name, public)
values ('maintenance-photos', 'maintenance-photos', true)
on conflict (id) do nothing;

-- Allow public read access to the bucket
create policy "Public Access to Maintenance Photos"
on storage.objects for select
to public
using ( bucket_id = 'maintenance-photos' );

-- Allow authenticated app users to insert files if needed later
create policy "Authenticated users can upload photos"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'maintenance-photos' );

-- Service role (openclaw agent) bypasses RLS and has full access automatically.
