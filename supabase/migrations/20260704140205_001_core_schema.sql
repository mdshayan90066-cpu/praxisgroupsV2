-- Ensure pgcrypto is available for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

/*
# Praxis Group - Core Schema

## IMPORTANT — why this file has so many ALTER TABLE ADD COLUMN IF NOT EXISTS lines
`CREATE TABLE IF NOT EXISTS` is a no-op when the table already exists in the database
(which several tables here did, from an earlier/older schema). That means none of the
columns declared inside those CREATE TABLE blocks actually get added on a database
that already has the table. Every table below therefore has an explicit block of
`ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...` statements immediately after its
CREATE TABLE, so this migration is safe and idempotent whether a table is being
created fresh or already existed with a different (older) set of columns.
*/

-- ============================================================
-- Workshop Categories
-- ============================================================
CREATE TABLE IF NOT EXISTS workshop_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text,
  color text DEFAULT '#C9A84C',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE workshop_categories ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE workshop_categories ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE workshop_categories ADD COLUMN IF NOT EXISTS color text DEFAULT '#C9A84C';
ALTER TABLE workshop_categories ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

ALTER TABLE workshop_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_workshop_categories" ON workshop_categories;
CREATE POLICY "public_read_workshop_categories" ON workshop_categories FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_workshop_categories" ON workshop_categories;
CREATE POLICY "auth_insert_workshop_categories" ON workshop_categories FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_workshop_categories" ON workshop_categories;
CREATE POLICY "auth_update_workshop_categories" ON workshop_categories FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_workshop_categories" ON workshop_categories;
CREATE POLICY "auth_delete_workshop_categories" ON workshop_categories FOR DELETE TO authenticated USING (true);

UPDATE workshop_categories
SET slug = regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g')
WHERE slug IS NULL;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM workshop_categories WHERE slug IS NULL) THEN
    ALTER TABLE workshop_categories ALTER COLUMN slug SET NOT NULL;
  ELSE
    RAISE NOTICE 'Some workshop_categories rows have NULL slug; leaving column nullable.';
  END IF;
END$$;
CREATE UNIQUE INDEX IF NOT EXISTS idx_workshop_categories_slug ON workshop_categories(slug);

-- ============================================================
-- Internship Categories
-- ============================================================
CREATE TABLE IF NOT EXISTS internship_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text,
  color text DEFAULT '#2D6A4F',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE internship_categories ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE internship_categories ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE internship_categories ADD COLUMN IF NOT EXISTS color text DEFAULT '#2D6A4F';
ALTER TABLE internship_categories ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

ALTER TABLE internship_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_internship_categories" ON internship_categories;
CREATE POLICY "public_read_internship_categories" ON internship_categories FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_internship_categories" ON internship_categories;
CREATE POLICY "auth_insert_internship_categories" ON internship_categories FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_internship_categories" ON internship_categories;
CREATE POLICY "auth_update_internship_categories" ON internship_categories FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_internship_categories" ON internship_categories;
CREATE POLICY "auth_delete_internship_categories" ON internship_categories FOR DELETE TO authenticated USING (true);

UPDATE internship_categories
SET slug = regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g')
WHERE slug IS NULL;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM internship_categories WHERE slug IS NULL) THEN
    ALTER TABLE internship_categories ALTER COLUMN slug SET NOT NULL;
  ELSE
    RAISE NOTICE 'Some internship_categories rows have NULL slug; leaving column nullable.';
  END IF;
END$$;
CREATE UNIQUE INDEX IF NOT EXISTS idx_internship_categories_slug ON internship_categories(slug);

-- ============================================================
-- Companies
-- ============================================================
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text,
  logo_url text,
  banner_url text,
  website text,
  industry text,
  description text,
  hr_contact_name text,
  hr_contact_email text,
  hr_contact_phone text,
  linkedin_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE companies ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS banner_url text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS website text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS industry text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS hr_contact_name text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS hr_contact_email text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS hr_contact_phone text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS linkedin_url text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE companies ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_approved_companies" ON companies;
CREATE POLICY "public_read_approved_companies" ON companies FOR SELECT TO anon, authenticated USING (status = 'approved');
DROP POLICY IF EXISTS "auth_insert_companies" ON companies;
CREATE POLICY "auth_insert_companies" ON companies FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_own_company" ON companies;
CREATE POLICY "auth_update_own_company" ON companies FOR UPDATE TO authenticated USING (auth.uid() = user_id OR user_id IS NULL) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_companies" ON companies;
CREATE POLICY "auth_delete_companies" ON companies FOR DELETE TO authenticated USING (auth.uid() = user_id OR user_id IS NULL);

-- ============================================================
-- Students
-- ============================================================
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  avatar_url text,
  college text,
  degree text,
  graduation_year integer,
  skills text[],
  resume_url text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE students ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS college text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS degree text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS graduation_year integer;
ALTER TABLE students ADD COLUMN IF NOT EXISTS skills text[];
ALTER TABLE students ADD COLUMN IF NOT EXISTS resume_url text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
ALTER TABLE students ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE students ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "students_read_own" ON students;
CREATE POLICY "students_read_own" ON students FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "students_insert_own" ON students;
CREATE POLICY "students_insert_own" ON students FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "students_update_own" ON students;
CREATE POLICY "students_update_own" ON students FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "students_delete_own" ON students;
CREATE POLICY "students_delete_own" ON students FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- Workshops
-- ============================================================
CREATE TABLE IF NOT EXISTS workshops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thumbnail_url text,
  banner_url text,
  name text NOT NULL,
  slug text,
  category_id uuid REFERENCES workshop_categories(id) ON DELETE SET NULL,
  workshop_type text NOT NULL DEFAULT 'online' CHECK (workshop_type IN ('online', 'offline', 'hybrid')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed', 'archived')),
  application_start_date date,
  application_end_date date,
  commencement_date date,
  end_date date,
  registration_deadline date,
  instructor_name text,
  instructor_image_url text,
  duration text,
  price_type text NOT NULL DEFAULT 'free' CHECK (price_type IN ('free', 'paid')),
  price numeric(10,2),
  currency text DEFAULT 'INR',
  seats_available integer,
  description text,
  learning_outcomes text[],
  curriculum jsonb,
  requirements text[],
  resources jsonb,
  certificate_available boolean DEFAULT false,
  meeting_link text,
  recording_link text,
  tags text[],
  seo_title text,
  seo_description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE workshops ADD COLUMN IF NOT EXISTS thumbnail_url text;
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS banner_url text;
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES workshop_categories(id) ON DELETE SET NULL;
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS workshop_type text DEFAULT 'online';
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft';
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS application_start_date date;
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS application_end_date date;
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS commencement_date date;
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS end_date date;
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS registration_deadline date;
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS instructor_name text;
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS instructor_image_url text;
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS duration text;
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS price_type text DEFAULT 'free';
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS price numeric(10,2);
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS currency text DEFAULT 'INR';
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS seats_available integer;
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS learning_outcomes text[];
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS curriculum jsonb;
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS requirements text[];
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS resources jsonb;
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS certificate_available boolean DEFAULT false;
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS meeting_link text;
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS recording_link text;
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS tags text[];
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS seo_title text;
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS seo_description text;
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE workshops ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_active_workshops" ON workshops;
CREATE POLICY "public_read_active_workshops" ON workshops FOR SELECT TO anon, authenticated USING (status = 'active');
DROP POLICY IF EXISTS "auth_insert_workshops" ON workshops;
CREATE POLICY "auth_insert_workshops" ON workshops FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_workshops" ON workshops;
CREATE POLICY "auth_update_workshops" ON workshops FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_workshops" ON workshops;
CREATE POLICY "auth_delete_workshops" ON workshops FOR DELETE TO authenticated USING (true);

-- ============================================================
-- Internships
-- ============================================================
CREATE TABLE IF NOT EXISTS internships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thumbnail_url text,
  company_logo_url text,
  banner_url text,
  name text NOT NULL,
  slug text,
  category_id uuid REFERENCES internship_categories(id) ON DELETE SET NULL,
  domain text,
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  partner_company_name text,
  description text,
  roles text[],
  responsibilities text[],
  skills_required text[],
  eligibility text,
  duration text,
  work_mode text NOT NULL DEFAULT 'remote' CHECK (work_mode IN ('remote', 'hybrid', 'on-site')),
  location text,
  number_of_openings integer,
  application_start_date date,
  application_end_date date,
  internship_start_date date,
  internship_end_date date,
  stipend_type text NOT NULL DEFAULT 'unpaid' CHECK (stipend_type IN ('paid', 'unpaid')),
  stipend_amount numeric(10,2),
  stipend_currency text DEFAULT 'INR',
  certificate_provided boolean DEFAULT true,
  lor_provided boolean DEFAULT false,
  projects_included boolean DEFAULT false,
  mentor text,
  assessment_criteria text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'closed', 'archived')),
  seo_title text,
  seo_description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE internships ADD COLUMN IF NOT EXISTS thumbnail_url text;
ALTER TABLE internships ADD COLUMN IF NOT EXISTS company_logo_url text;
ALTER TABLE internships ADD COLUMN IF NOT EXISTS banner_url text;
ALTER TABLE internships ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE internships ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE internships ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES internship_categories(id) ON DELETE SET NULL;
ALTER TABLE internships ADD COLUMN IF NOT EXISTS domain text;
ALTER TABLE internships ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id) ON DELETE SET NULL;
ALTER TABLE internships ADD COLUMN IF NOT EXISTS partner_company_name text;
ALTER TABLE internships ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE internships ADD COLUMN IF NOT EXISTS roles text[];
ALTER TABLE internships ADD COLUMN IF NOT EXISTS responsibilities text[];
ALTER TABLE internships ADD COLUMN IF NOT EXISTS skills_required text[];
ALTER TABLE internships ADD COLUMN IF NOT EXISTS eligibility text;
ALTER TABLE internships ADD COLUMN IF NOT EXISTS duration text;
ALTER TABLE internships ADD COLUMN IF NOT EXISTS work_mode text DEFAULT 'remote';
ALTER TABLE internships ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE internships ADD COLUMN IF NOT EXISTS number_of_openings integer;
ALTER TABLE internships ADD COLUMN IF NOT EXISTS application_start_date date;
ALTER TABLE internships ADD COLUMN IF NOT EXISTS application_end_date date;
ALTER TABLE internships ADD COLUMN IF NOT EXISTS internship_start_date date;
ALTER TABLE internships ADD COLUMN IF NOT EXISTS internship_end_date date;
ALTER TABLE internships ADD COLUMN IF NOT EXISTS stipend_type text DEFAULT 'unpaid';
ALTER TABLE internships ADD COLUMN IF NOT EXISTS stipend_amount numeric(10,2);
ALTER TABLE internships ADD COLUMN IF NOT EXISTS stipend_currency text DEFAULT 'INR';
ALTER TABLE internships ADD COLUMN IF NOT EXISTS certificate_provided boolean DEFAULT true;
ALTER TABLE internships ADD COLUMN IF NOT EXISTS lor_provided boolean DEFAULT false;
ALTER TABLE internships ADD COLUMN IF NOT EXISTS projects_included boolean DEFAULT false;
ALTER TABLE internships ADD COLUMN IF NOT EXISTS mentor text;
ALTER TABLE internships ADD COLUMN IF NOT EXISTS assessment_criteria text;
ALTER TABLE internships ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft';
ALTER TABLE internships ADD COLUMN IF NOT EXISTS seo_title text;
ALTER TABLE internships ADD COLUMN IF NOT EXISTS seo_description text;
ALTER TABLE internships ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE internships ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE internships ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_open_internships" ON internships;
CREATE POLICY "public_read_open_internships" ON internships FOR SELECT TO anon, authenticated USING (status = 'open');
DROP POLICY IF EXISTS "auth_insert_internships" ON internships;
CREATE POLICY "auth_insert_internships" ON internships FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_internships" ON internships;
CREATE POLICY "auth_update_internships" ON internships FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_internships" ON internships;
CREATE POLICY "auth_delete_internships" ON internships FOR DELETE TO authenticated USING (true);

-- ============================================================
-- Workshop Applications
-- ============================================================
CREATE TABLE IF NOT EXISTS workshop_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id uuid NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed', 'payment_pending', 'paid')),
  payment_status text DEFAULT 'not_required' CHECK (payment_status IN ('not_required', 'pending', 'successful', 'failed', 'refunded')),
  applied_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(workshop_id, student_id)
);

ALTER TABLE workshop_applications ADD COLUMN IF NOT EXISTS workshop_id uuid REFERENCES workshops(id) ON DELETE CASCADE;
ALTER TABLE workshop_applications ADD COLUMN IF NOT EXISTS student_id uuid REFERENCES students(id) ON DELETE CASCADE;
ALTER TABLE workshop_applications ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
ALTER TABLE workshop_applications ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'not_required';
ALTER TABLE workshop_applications ADD COLUMN IF NOT EXISTS applied_at timestamptz DEFAULT now();
ALTER TABLE workshop_applications ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE workshop_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "students_read_own_workshop_apps" ON workshop_applications;
CREATE POLICY "students_read_own_workshop_apps" ON workshop_applications FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM students WHERE students.id = workshop_applications.student_id AND students.user_id = auth.uid())
);
DROP POLICY IF EXISTS "students_insert_workshop_apps" ON workshop_applications;
CREATE POLICY "students_insert_workshop_apps" ON workshop_applications FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM students WHERE students.id = workshop_applications.student_id AND students.user_id = auth.uid())
);
DROP POLICY IF EXISTS "students_update_workshop_apps" ON workshop_applications;
CREATE POLICY "students_update_workshop_apps" ON workshop_applications FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM students WHERE students.id = workshop_applications.student_id AND students.user_id = auth.uid())
) WITH CHECK (true);
DROP POLICY IF EXISTS "students_delete_workshop_apps" ON workshop_applications;
CREATE POLICY "students_delete_workshop_apps" ON workshop_applications FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM students WHERE students.id = workshop_applications.student_id AND students.user_id = auth.uid())
);

-- ============================================================
-- Internship Applications
-- ============================================================
CREATE TABLE IF NOT EXISTS internship_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  internship_id uuid NOT NULL REFERENCES internships(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed', 'interview_scheduled')),
  cover_letter text,
  applied_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(internship_id, student_id)
);

ALTER TABLE internship_applications ADD COLUMN IF NOT EXISTS internship_id uuid REFERENCES internships(id) ON DELETE CASCADE;
ALTER TABLE internship_applications ADD COLUMN IF NOT EXISTS student_id uuid REFERENCES students(id) ON DELETE CASCADE;
ALTER TABLE internship_applications ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
ALTER TABLE internship_applications ADD COLUMN IF NOT EXISTS cover_letter text;
ALTER TABLE internship_applications ADD COLUMN IF NOT EXISTS applied_at timestamptz DEFAULT now();
ALTER TABLE internship_applications ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE internship_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "students_read_own_intern_apps" ON internship_applications;
CREATE POLICY "students_read_own_intern_apps" ON internship_applications FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM students WHERE students.id = internship_applications.student_id AND students.user_id = auth.uid())
);
DROP POLICY IF EXISTS "students_insert_intern_apps" ON internship_applications;
CREATE POLICY "students_insert_intern_apps" ON internship_applications FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM students WHERE students.id = internship_applications.student_id AND students.user_id = auth.uid())
);
DROP POLICY IF EXISTS "students_update_intern_apps" ON internship_applications;
CREATE POLICY "students_update_intern_apps" ON internship_applications FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM students WHERE students.id = internship_applications.student_id AND students.user_id = auth.uid())
) WITH CHECK (true);
DROP POLICY IF EXISTS "students_delete_intern_apps" ON internship_applications;
CREATE POLICY "students_delete_intern_apps" ON internship_applications FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM students WHERE students.id = internship_applications.student_id AND students.user_id = auth.uid())
);

-- ============================================================
-- Certificates
-- ============================================================
CREATE TABLE IF NOT EXISTS certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_number text UNIQUE NOT NULL,
  student_id uuid REFERENCES students(id) ON DELETE SET NULL,
  student_name text NOT NULL,
  program_name text NOT NULL,
  program_type text NOT NULL CHECK (program_type IN ('workshop', 'internship')),
  workshop_id uuid REFERENCES workshops(id) ON DELETE SET NULL,
  internship_id uuid REFERENCES internships(id) ON DELETE SET NULL,
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  expiry_date date,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
  template_id uuid,
  qr_code_url text,
  pdf_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE certificates ADD COLUMN IF NOT EXISTS certificate_number text;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS student_id uuid REFERENCES students(id) ON DELETE SET NULL;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS student_name text;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS program_name text;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS program_type text;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS workshop_id uuid REFERENCES workshops(id) ON DELETE SET NULL;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS internship_id uuid REFERENCES internships(id) ON DELETE SET NULL;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS issue_date date DEFAULT CURRENT_DATE;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS expiry_date date;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS template_id uuid;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS qr_code_url text;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS pdf_url text;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_certificates" ON certificates;
CREATE POLICY "public_read_certificates" ON certificates FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_certificates" ON certificates;
CREATE POLICY "auth_insert_certificates" ON certificates FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_certificates" ON certificates;
CREATE POLICY "auth_update_certificates" ON certificates FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_certificates" ON certificates;
CREATE POLICY "auth_delete_certificates" ON certificates FOR DELETE TO authenticated USING (true);

-- ============================================================
-- Payments
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE SET NULL,
  workshop_application_id uuid REFERENCES workshop_applications(id) ON DELETE SET NULL,
  amount numeric(10,2) NOT NULL,
  currency text DEFAULT 'INR',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'successful', 'failed', 'refunded')),
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_signature text,
  receipt_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE payments ADD COLUMN IF NOT EXISTS student_id uuid REFERENCES students(id) ON DELETE SET NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS workshop_application_id uuid REFERENCES workshop_applications(id) ON DELETE SET NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS amount numeric(10,2);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS currency text DEFAULT 'INR';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS razorpay_order_id text;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS razorpay_payment_id text;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS razorpay_signature text;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS receipt_url text;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE payments ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "students_read_own_payments" ON payments;
CREATE POLICY "students_read_own_payments" ON payments FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM students WHERE students.id = payments.student_id AND students.user_id = auth.uid())
);
DROP POLICY IF EXISTS "students_insert_payments" ON payments;
CREATE POLICY "students_insert_payments" ON payments FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "students_update_payments" ON payments;
CREATE POLICY "students_update_payments" ON payments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "students_delete_payments" ON payments;
CREATE POLICY "students_delete_payments" ON payments FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM students WHERE students.id = payments.student_id AND students.user_id = auth.uid())
);

-- ============================================================
-- Attendance
-- ============================================================
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  workshop_id uuid REFERENCES workshops(id) ON DELETE CASCADE,
  internship_id uuid REFERENCES internships(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late')),
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE attendance ADD COLUMN IF NOT EXISTS student_id uuid REFERENCES students(id) ON DELETE CASCADE;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS workshop_id uuid REFERENCES workshops(id) ON DELETE CASCADE;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS internship_id uuid REFERENCES internships(id) ON DELETE CASCADE;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS date date DEFAULT CURRENT_DATE;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS status text DEFAULT 'present';
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "students_read_own_attendance" ON attendance;
CREATE POLICY "students_read_own_attendance" ON attendance FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM students WHERE students.id = attendance.student_id AND students.user_id = auth.uid())
);
DROP POLICY IF EXISTS "auth_insert_attendance" ON attendance;
CREATE POLICY "auth_insert_attendance" ON attendance FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_attendance" ON attendance;
CREATE POLICY "auth_update_attendance" ON attendance FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_attendance" ON attendance;
CREATE POLICY "auth_delete_attendance" ON attendance FOR DELETE TO authenticated USING (true);

-- ============================================================
-- Assignments
-- ============================================================
CREATE TABLE IF NOT EXISTS assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  workshop_id uuid REFERENCES workshops(id) ON DELETE CASCADE,
  internship_id uuid REFERENCES internships(id) ON DELETE CASCADE,
  due_date timestamptz,
  max_marks integer DEFAULT 100,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE assignments ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS workshop_id uuid REFERENCES workshops(id) ON DELETE CASCADE;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS internship_id uuid REFERENCES internships(id) ON DELETE CASCADE;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS due_date timestamptz;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS max_marks integer DEFAULT 100;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_assignments" ON assignments;
CREATE POLICY "public_read_assignments" ON assignments FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_assignments" ON assignments;
CREATE POLICY "auth_insert_assignments" ON assignments FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_assignments" ON assignments;
CREATE POLICY "auth_update_assignments" ON assignments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_assignments" ON assignments;
CREATE POLICY "auth_delete_assignments" ON assignments FOR DELETE TO authenticated USING (true);

-- ============================================================
-- Notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  read boolean DEFAULT false,
  link text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS message text;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type text DEFAULT 'info';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read boolean DEFAULT false;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link text;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_read_own_notifications" ON notifications;
CREATE POLICY "users_read_own_notifications" ON notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "auth_insert_notifications" ON notifications;
CREATE POLICY "auth_insert_notifications" ON notifications FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "users_update_own_notifications" ON notifications;
CREATE POLICY "users_update_own_notifications" ON notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (true);
DROP POLICY IF EXISTS "users_delete_own_notifications" ON notifications;
CREATE POLICY "users_delete_own_notifications" ON notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- Company Partnership Requests
-- ============================================================
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

ALTER TABLE company_partnership_requests ADD COLUMN IF NOT EXISTS company_name text;
ALTER TABLE company_partnership_requests ADD COLUMN IF NOT EXISTS contact_name text;
ALTER TABLE company_partnership_requests ADD COLUMN IF NOT EXISTS contact_email text;
ALTER TABLE company_partnership_requests ADD COLUMN IF NOT EXISTS contact_phone text;
ALTER TABLE company_partnership_requests ADD COLUMN IF NOT EXISTS website text;
ALTER TABLE company_partnership_requests ADD COLUMN IF NOT EXISTS industry text;
ALTER TABLE company_partnership_requests ADD COLUMN IF NOT EXISTS message text;
ALTER TABLE company_partnership_requests ADD COLUMN IF NOT EXISTS request_type text DEFAULT 'partnership';
ALTER TABLE company_partnership_requests ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
ALTER TABLE company_partnership_requests ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

ALTER TABLE company_partnership_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_insert_partnership_requests" ON company_partnership_requests;
CREATE POLICY "anon_insert_partnership_requests" ON company_partnership_requests FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_read_partnership_requests" ON company_partnership_requests;
CREATE POLICY "auth_read_partnership_requests" ON company_partnership_requests FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_update_partnership_requests" ON company_partnership_requests;
CREATE POLICY "auth_update_partnership_requests" ON company_partnership_requests FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_partnership_requests" ON company_partnership_requests;
CREATE POLICY "auth_delete_partnership_requests" ON company_partnership_requests FOR DELETE TO authenticated USING (true);

-- ============================================================
-- Indexes for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_workshops_status ON workshops(status);
CREATE INDEX IF NOT EXISTS idx_workshops_category ON workshops(category_id);
CREATE INDEX IF NOT EXISTS idx_internships_status ON internships(status);
CREATE INDEX IF NOT EXISTS idx_internships_company ON internships(company_id);
CREATE INDEX IF NOT EXISTS idx_workshop_applications_student ON workshop_applications(student_id);
CREATE INDEX IF NOT EXISTS idx_internship_applications_student ON internship_applications(student_id);
CREATE INDEX IF NOT EXISTS idx_certificates_number ON certificates(certificate_number);
CREATE INDEX IF NOT EXISTS idx_students_user ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

-- Ensure slug uniqueness across entities by creating unique indexes if slugs exist.
CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_slug ON companies(slug);
CREATE UNIQUE INDEX IF NOT EXISTS idx_workshops_slug ON workshops(slug);
CREATE UNIQUE INDEX IF NOT EXISTS idx_internships_slug ON internships(slug);

-- ============================================================
-- Seed default categories
-- ============================================================
INSERT INTO workshop_categories (name, slug, color) VALUES
  ('Technology', 'technology', '#C9A84C'),
  ('Business', 'business', '#2D6A4F'),
  ('Design', 'design', '#C9A84C'),
  ('Marketing', 'marketing', '#2D6A4F'),
  ('Finance', 'finance', '#C9A84C'),
  ('Leadership', 'leadership', '#2D6A4F')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO internship_categories (name, slug, color) VALUES
  ('Software Development', 'software-development', '#C9A84C'),
  ('Data Science', 'data-science', '#2D6A4F'),
  ('Marketing', 'marketing', '#C9A84C'),
  ('Finance', 'finance', '#2D6A4F'),
  ('Design', 'design', '#C9A84C'),
  ('Business Development', 'business-development', '#2D6A4F')
ON CONFLICT (slug) DO NOTHING;
