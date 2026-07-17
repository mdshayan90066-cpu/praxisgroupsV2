-- ============================================================
-- MIGRATION: Add resumes storage bucket & update application tables
-- Run this in your Supabase Dashboard SQL Editor
-- ============================================================

-- 1. Create the 'resumes' storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow public read access to the resumes bucket
DROP POLICY IF EXISTS "public_read_resumes" ON storage.objects;
CREATE POLICY "public_read_resumes" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'resumes');

-- 3. Allow anon & authenticated users to upload to the resumes bucket
DROP POLICY IF EXISTS "anon_upload_resumes" ON storage.objects;
CREATE POLICY "anon_upload_resumes" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'resumes');

DROP POLICY IF EXISTS "anon_update_resumes" ON storage.objects;
CREATE POLICY "anon_update_resumes" ON storage.objects
  FOR UPDATE TO anon, authenticated
  USING (bucket_id = 'resumes')
  WITH CHECK (bucket_id = 'resumes');

-- 4. Add resume_url column to internship_applications if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'internship_applications' AND column_name = 'resume_url'
  ) THEN
    ALTER TABLE internship_applications ADD COLUMN resume_url text;
  END IF;
END $$;

-- 5. Add resume_url & cover_letter_url to workshop_applications if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'workshop_applications' AND column_name = 'resume_url'
  ) THEN
    ALTER TABLE workshop_applications ADD COLUMN resume_url text;
  END IF;
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'workshop_applications' AND column_name = 'cover_letter'
  ) THEN
    ALTER TABLE workshop_applications ADD COLUMN cover_letter text;
  END IF;
END $$;

-- ============================================================
-- DONE! The resumes bucket and application columns are ready.
-- ============================================================
