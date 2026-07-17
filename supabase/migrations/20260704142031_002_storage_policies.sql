/*
# Storage Bucket Policies

Allow public read access to uploaded workshop and internship assets.
Allow authenticated users to upload files.
*/

-- Workshop assets
DROP POLICY IF EXISTS "public_read_workshop_assets" ON storage.objects;
CREATE POLICY "public_read_workshop_assets" ON storage.objects FOR SELECT
TO anon, authenticated USING (bucket_id = 'workshop-assets');

DROP POLICY IF EXISTS "auth_upload_workshop_assets" ON storage.objects;
CREATE POLICY "auth_upload_workshop_assets" ON storage.objects FOR INSERT
TO authenticated WITH CHECK (bucket_id = 'workshop-assets');

DROP POLICY IF EXISTS "auth_update_workshop_assets" ON storage.objects;
CREATE POLICY "auth_update_workshop_assets" ON storage.objects FOR UPDATE
TO authenticated USING (bucket_id = 'workshop-assets');

-- Internship assets
DROP POLICY IF EXISTS "public_read_internship_assets" ON storage.objects;
CREATE POLICY "public_read_internship_assets" ON storage.objects FOR SELECT
TO anon, authenticated USING (bucket_id = 'internship-assets');

DROP POLICY IF EXISTS "auth_upload_internship_assets" ON storage.objects;
CREATE POLICY "auth_upload_internship_assets" ON storage.objects FOR INSERT
TO authenticated WITH CHECK (bucket_id = 'internship-assets');

DROP POLICY IF EXISTS "auth_update_internship_assets" ON storage.objects;
CREATE POLICY "auth_update_internship_assets" ON storage.objects FOR UPDATE
TO authenticated USING (bucket_id = 'internship-assets');
