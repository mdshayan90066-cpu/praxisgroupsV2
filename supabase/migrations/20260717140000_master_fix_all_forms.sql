-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  MASTER FIX: Ensure ALL tables & columns match ALL forms in the app   ║
-- ║  Run this ONCE in Supabase SQL Editor to fix everything               ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 1. STUDENTS TABLE — used by ApplicationFormModal + AuthContext
--    Form fields: full_name, email, phone, resume, applicant_status,
--                 college, branch, year, company_name, position
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ALTER TABLE students ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS college text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS degree text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS graduation_year integer;
ALTER TABLE students ADD COLUMN IF NOT EXISTS skills text[];
ALTER TABLE students ADD COLUMN IF NOT EXISTS resume_url text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS applicant_status text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS branch text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS year_of_study text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS company_name text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS position text;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 2. WORKSHOP APPLICATIONS — RPC inserts cover_letter & resume_url
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ALTER TABLE workshop_applications ADD COLUMN IF NOT EXISTS cover_letter text;
ALTER TABLE workshop_applications ADD COLUMN IF NOT EXISTS resume_url text;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 3. WORKSHOPS & INTERNSHIPS — Missing admin/form columns
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES workshop_categories(id) ON DELETE SET NULL;
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS banner_url text;
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS thumbnail_url text;
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS application_start_date date;
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS application_end_date date;
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS commencement_date date;
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS end_date date;
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS registration_deadline date;
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS instructor_name text;
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS instructor_image_url text;
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS certificate_available boolean DEFAULT false;
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS meeting_link text;
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS recording_link text;
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS tags text[];
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS seo_title text;
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS seo_description text;
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS duration text;
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS workshop_type text DEFAULT 'online';
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS learning_outcomes text[];
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS requirements text[];
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS price_type text DEFAULT 'free';
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS price numeric(10,2);
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS currency text DEFAULT 'INR';
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS seats_available integer;
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS curriculum jsonb;
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS resources jsonb;

ALTER TABLE internships ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES internship_categories(id) ON DELETE SET NULL;
ALTER TABLE internships ADD COLUMN IF NOT EXISTS banner_url text;
ALTER TABLE internships ADD COLUMN IF NOT EXISTS thumbnail_url text;
ALTER TABLE internships ADD COLUMN IF NOT EXISTS company_logo_url text;
ALTER TABLE internships ADD COLUMN IF NOT EXISTS domain text;
ALTER TABLE internships ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id) ON DELETE SET NULL;
ALTER TABLE internships ADD COLUMN IF NOT EXISTS partner_company_name text;
ALTER TABLE internships ADD COLUMN IF NOT EXISTS roles text[];
ALTER TABLE internships ADD COLUMN IF NOT EXISTS responsibilities text[];
ALTER TABLE internships ADD COLUMN IF NOT EXISTS skills_required text[];
ALTER TABLE internships ADD COLUMN IF NOT EXISTS eligibility text;
ALTER TABLE internships ADD COLUMN IF NOT EXISTS number_of_openings integer;
ALTER TABLE internships ADD COLUMN IF NOT EXISTS application_start_date date;
ALTER TABLE internships ADD COLUMN IF NOT EXISTS application_end_date date;
ALTER TABLE internships ADD COLUMN IF NOT EXISTS internship_start_date date;
ALTER TABLE internships ADD COLUMN IF NOT EXISTS internship_end_date date;
ALTER TABLE internships ADD COLUMN IF NOT EXISTS certificate_provided boolean DEFAULT true;
ALTER TABLE internships ADD COLUMN IF NOT EXISTS lor_provided boolean DEFAULT false;
ALTER TABLE internships ADD COLUMN IF NOT EXISTS projects_included boolean DEFAULT false;
ALTER TABLE internships ADD COLUMN IF NOT EXISTS mentor text;
ALTER TABLE internships ADD COLUMN IF NOT EXISTS assessment_criteria text;
ALTER TABLE internships ADD COLUMN IF NOT EXISTS seo_title text;
ALTER TABLE internships ADD COLUMN IF NOT EXISTS seo_description text;
ALTER TABLE internships ADD COLUMN IF NOT EXISTS stipend_type text;
ALTER TABLE internships ADD COLUMN IF NOT EXISTS stipend_amount numeric(10,2);
ALTER TABLE internships ADD COLUMN IF NOT EXISTS stipend_currency text;
ALTER TABLE internships ADD COLUMN IF NOT EXISTS work_mode text;
ALTER TABLE internships ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE internships ADD COLUMN IF NOT EXISTS duration text;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 4. CONTACT MESSAGES — Contact page form (name, email, subject, message)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'replied', 'archived')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_insert_contact" ON contact_messages;
CREATE POLICY "anon_insert_contact" ON contact_messages FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_read_contact" ON contact_messages;
CREATE POLICY "auth_read_contact" ON contact_messages FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_update_contact" ON contact_messages;
CREATE POLICY "auth_update_contact" ON contact_messages FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_contact" ON contact_messages;
CREATE POLICY "auth_delete_contact" ON contact_messages FOR DELETE TO authenticated USING (true);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 5. SUPPORT TICKETS — Student support form
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject text NOT NULL,
  description text NOT NULL,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "students_read_own_tickets" ON support_tickets;
CREATE POLICY "students_read_own_tickets" ON support_tickets FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM students WHERE students.id = support_tickets.student_id AND students.user_id = auth.uid())
);
DROP POLICY IF EXISTS "students_insert_tickets" ON support_tickets;
CREATE POLICY "students_insert_tickets" ON support_tickets FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM students WHERE students.id = support_tickets.student_id AND students.user_id = auth.uid())
);
DROP POLICY IF EXISTS "auth_read_all_tickets" ON support_tickets;
CREATE POLICY "auth_read_all_tickets" ON support_tickets FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_update_tickets" ON support_tickets;
CREATE POLICY "auth_update_tickets" ON support_tickets FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 6. EMAIL LOGS — Admin email sending + edge function logging
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE TABLE IF NOT EXISTS email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  body text,
  audience text DEFAULT 'custom',
  recipient_count integer DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'logged')),
  sent_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_manage_email_logs" ON email_logs;
CREATE POLICY "auth_manage_email_logs" ON email_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 7. COMPANY PARTNERSHIP REQUESTS — ForCompanies page
--    Already in schema but ensure it exists
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE TABLE IF NOT EXISTS company_partnership_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  contact_name text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text,
  website text,
  industry text,
  message text,
  request_type text NOT NULL DEFAULT 'partnership' CHECK (request_type IN ('partnership', 'hire_interns', 'collaboration')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'accepted', 'rejected')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE company_partnership_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_insert_partnership_requests" ON company_partnership_requests;
CREATE POLICY "anon_insert_partnership_requests" ON company_partnership_requests FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_read_partnership_requests" ON company_partnership_requests;
CREATE POLICY "auth_read_partnership_requests" ON company_partnership_requests FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_update_partnership_requests" ON company_partnership_requests;
CREATE POLICY "auth_update_partnership_requests" ON company_partnership_requests FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_partnership_requests" ON company_partnership_requests;
CREATE POLICY "auth_delete_partnership_requests" ON company_partnership_requests FOR DELETE TO authenticated USING (true);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 8. STORAGE BUCKET — resumes, cover letters, application files, and team photos
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('resumes', 'resumes', true, 5242880, ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp']),
  ('internship-assets', 'internship-assets', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']),
  ('workshop-assets', 'workshop-assets', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']),
  ('company-assets', 'company-assets', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for public upload/read
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
CREATE POLICY "Allow public uploads" ON storage.objects
  FOR INSERT TO anon, authenticated WITH CHECK (bucket_id IN ('resumes', 'internship-assets', 'workshop-assets', 'company-assets'));

DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;
CREATE POLICY "Allow public reads" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id IN ('resumes', 'internship-assets', 'workshop-assets', 'company-assets'));

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 8.5. TEAM MEMBERS — About page
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL,
  photo_url text,
  display_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_team_members" ON team_members;
CREATE POLICY "public_read_team_members" ON team_members FOR SELECT TO anon, authenticated USING (is_visible = true);
DROP POLICY IF EXISTS "auth_insert_team_members" ON team_members;
CREATE POLICY "auth_insert_team_members" ON team_members FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_team_members" ON team_members;
CREATE POLICY "auth_update_team_members" ON team_members FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_team_members" ON team_members;
CREATE POLICY "auth_delete_team_members" ON team_members FOR DELETE TO authenticated USING (true);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 9. SUBMIT_APPLICATION RPC — the main application function
--    Drop ALL old versions and create the definitive one
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DO $$
DECLARE
  r RECORD;
BEGIN
  -- Drop all overloads of submit_application
  FOR r IN (
    SELECT p.oid::regprocedure AS func_sig
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'submit_application'
  ) LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_sig || ' CASCADE';
  END LOOP;
END $$;

CREATE FUNCTION submit_application(
  p_type text,
  p_program_id uuid,
  p_full_name text,
  p_email text,
  p_phone text,
  p_resume_url text,
  p_cover_letter text,
  p_price_type text,
  p_applicant_status text DEFAULT NULL,
  p_college text DEFAULT NULL,
  p_branch text DEFAULT NULL,
  p_year text DEFAULT NULL,
  p_company_name text DEFAULT NULL,
  p_position text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $fn$
DECLARE
  v_student_id uuid;
  v_application_id uuid;
  v_status text;
  v_payment_status text;
BEGIN
  -- Upsert student
  SELECT id INTO v_student_id FROM students WHERE email = p_email LIMIT 1;

  IF v_student_id IS NULL THEN
    INSERT INTO students (
      full_name, email, phone, resume_url,
      applicant_status, college, branch, year_of_study,
      company_name, position
    )
    VALUES (
      p_full_name, p_email, p_phone, p_resume_url,
      p_applicant_status, p_college, p_branch, p_year,
      p_company_name, p_position
    )
    RETURNING id INTO v_student_id;
  ELSE
    UPDATE students
    SET full_name = p_full_name,
        phone = p_phone,
        resume_url = p_resume_url,
        applicant_status = COALESCE(p_applicant_status, applicant_status),
        college = COALESCE(p_college, college),
        branch = COALESCE(p_branch, branch),
        year_of_study = COALESCE(p_year, year_of_study),
        company_name = COALESCE(p_company_name, company_name),
        position = COALESCE(p_position, position),
        updated_at = now()
    WHERE id = v_student_id;
  END IF;

  -- Insert application
  IF p_type = 'internship' THEN
    INSERT INTO internship_applications (internship_id, student_id, cover_letter, status)
    VALUES (p_program_id, v_student_id, p_cover_letter, 'pending')
    RETURNING id INTO v_application_id;

  ELSIF p_type = 'workshop' THEN
    IF p_price_type = 'paid' THEN
      v_status := 'payment_pending';
      v_payment_status := 'pending';
    ELSE
      v_status := 'accepted';
      v_payment_status := 'not_required';
    END IF;

    INSERT INTO workshop_applications (workshop_id, student_id, status, payment_status, cover_letter, resume_url)
    VALUES (p_program_id, v_student_id, v_status, v_payment_status, p_cover_letter, p_resume_url)
    RETURNING id INTO v_application_id;
  ELSE
    RAISE EXCEPTION 'Invalid application type';
  END IF;

  RETURN json_build_object(
    'applicationId', v_application_id,
    'studentId', v_student_id
  );
END;
$fn$;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 10. REFRESH SCHEMA CACHE
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NOTIFY pgrst, 'reload schema';
