-- Private Supabase Storage buckets for ReetzFam.org photos and documents.
-- Run after 001_initial_schema.sql so profiles, roles, and library_items exist.
--
-- Storage object visibility is intentionally tied to public.library_items:
-- - approved members may upload into the private buckets
-- - uploaders may read/update/delete their own objects
-- - admins may read/update/delete every object
-- - approved members may read objects with a matching library_items row whose
--   visibility is set to 'members'

do $$
begin
  if to_regclass('storage.buckets') is null or to_regclass('storage.objects') is null then
    raise exception 'Supabase Storage tables are not available. Enable Storage in this Supabase project first.';
  end if;

  if to_regclass('public.profiles') is null or to_regclass('public.library_items') is null then
    raise exception 'Run 001_initial_schema.sql before 005_private_storage_buckets.sql.';
  end if;
end $$;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
) values (
  'family-photos',
  'family-photos',
  false,
  15728640,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/heic',
    'image/heif'
  ]
), (
  'family-documents',
  'family-documents',
  false,
  52428800,
  array[
    'application/pdf',
    'text/plain',
    'text/csv',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]
)
on conflict (id) do update
set
  name = excluded.name,
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table storage.objects enable row level security;

drop policy if exists "members upload family storage objects" on storage.objects;
drop policy if exists "members read family storage objects" on storage.objects;
drop policy if exists "uploaders update family storage objects" on storage.objects;
drop policy if exists "uploaders delete family storage objects" on storage.objects;

create policy "members upload family storage objects"
on storage.objects
for insert
with check (
  bucket_id in ('family-photos', 'family-documents')
  and public.is_approved_member()
);

create policy "members read family storage objects"
on storage.objects
for select
using (
  bucket_id in ('family-photos', 'family-documents')
  and (
    public.has_role(array['admin','super_admin']::public.user_role[])
    or (
      public.is_approved_member()
      and (
        owner = auth.uid()
        or exists (
          select 1
          from public.library_items item
          where item.storage_path = storage.objects.name
            and (
              (storage.objects.bucket_id = 'family-photos' and item.item_type = 'photo')
              or (storage.objects.bucket_id = 'family-documents' and item.item_type = 'document')
            )
            and (
              item.visibility = 'members'
              or item.uploaded_by = public.current_profile_id()
            )
        )
      )
    )
  )
);

create policy "uploaders update family storage objects"
on storage.objects
for update
using (
  bucket_id in ('family-photos', 'family-documents')
  and (
    (public.is_approved_member() and owner = auth.uid())
    or public.has_role(array['admin','super_admin']::public.user_role[])
  )
)
with check (
  bucket_id in ('family-photos', 'family-documents')
  and (
    (public.is_approved_member() and owner = auth.uid())
    or public.has_role(array['admin','super_admin']::public.user_role[])
  )
);

create policy "uploaders delete family storage objects"
on storage.objects
for delete
using (
  bucket_id in ('family-photos', 'family-documents')
  and (
    (public.is_approved_member() and owner = auth.uid())
    or public.has_role(array['admin','super_admin']::public.user_role[])
  )
);
