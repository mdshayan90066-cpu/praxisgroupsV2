/*
# Praxis Group - Core Schema

## Overview
Complete relational schema for the Praxis Group EdTech SaaS platform.

## New Tables

### Categories
- `workshop_categories` - Categories for workshops (id, name, slug, color)
- `internship_categories` - Categories for internships (id, name, slug, color)

### Core Entities
- `companies` - Partner company profiles (name, logo, description, industry, contact info, status)
- `workshops` - Workshop listings with full metadata (thumbnail, banner, pricing, dates, curriculum, etc.)
- `internships` - Internship listings linked to companies
- `students` - Student profiles linked to auth.users
- `company_users` - Company portal users linked to auth.users

### Operations
- `workshop_applications` - Student workshop registrations/applications
- `internship_applications` - Student internship applications
- `certificates` - Issued certificates with QR/PDF support
- `payments` - Payment records (Razorpay integration ready)
- `attendance` - Workshop attendance records
- `assignments` - Student assignments
- `notifications` - User notifications
- `certificate_templates` - Admin-managed certificate templates
- `company_partnership_requests` - Company partnership/collaboration requests

## Security
- RLS enabled on all tables
- Admin operations use service role
- Students/companies scoped to their own data via auth.uid()
- Public data (active workshops, internships) readable by anon
*/

-- Workshop Categories
CREATE TABLE IF NOT EXISTS workshop_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  color text DEFAULT '#C9A84C',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE workshop_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_workshop_categories" ON workshop_categories;
CREATE POLICY "public_read_workshop_categories" ON workshop_categories FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_workshop_categories" ON workshop_categories;
CREATE POLICY "auth_insert_workshop_categories" ON workshop_categories FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_workshop_categories" ON workshop_categories;
CREATE POLICY "auth_update_workshop_categories" ON workshop_categories FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_workshop_categories" ON workshop_categories;
CREATE POLICY "auth_delete_workshop_categories" ON workshop_categories FOR DELETE TO authenticated USING (true);

-- Ensure legacy installs that already had the table but lacked a slug column are handled.
-- This adds the column if missing, populates slugs from name, and creates a unique index.
ALTER TABLE workshop_categories ADD COLUMN IF NOT EXISTS slug text;
-- Populate missing slugs from `name` (simple slugify). Only updates rows where slug is NULL.
UPDATE workshop_categories
SET slug = regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g')
WHERE slug IS NULL;
-- Only set NOT NULL if every row has a slug (avoid failing migrations if there are NULLs).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM workshop_categories WHERE slug IS NULL) THEN
    ALTER TABLE workshop_categories ALTER COLUMN slug SET NOT NULL;
  ELSE
    RAISE NOTICE 'Some workshop_categories rows have NULL slug; leaving column nullable.';
  END IF;
END$$;
-- Ensure a unique index on slug (used by ON CONFLICT in seeds)
CREATE UNIQUE INDEX IF NOT EXISTS idx_workshop_categories_slug ON workshop_categories(slug);

-- Internship Categories
CREATE TABLE IF NOT EXISTS internship_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  color text DEFAULT '#2D6A4F',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE internship_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_internship_categories" ON internship_categories;
CREATE POLICY "public_read_internship_categories" ON internship_categories FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_internship_categories" ON internship_categories;
CREATE POLICY "auth_insert_internship_categories" ON internship_categories FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_internship_categories" ON internship_categories;
CREATE POLICY "auth_update_internship_categories" ON internship_categories FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_internship_categories" ON internship_categories;
CREATE POLICY "auth_delete_internship_categories" ON internship_categories FOR DELETE TO authenticated USING (true);

-- Companies
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE,
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

-- Safety net: if `companies` already existed before this migration (from an earlier
-- version of the schema), CREATE TABLE IF NOT EXISTS above is a no-op and none of the
-- columns declared in it actually get added. These ALTER statements guarantee every
-- column this file depends on exists, whether the table was just created or already existed.
ALTER TABLE companies ADD COLUMN IF NOT EXISTS slug text UNIQUE;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS banner_url text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS website text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS industry text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS hr_contact_name text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS hr_contact_email text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS hr_contact_phone text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS linkedin_url text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_approved_companies" ON companies;
CREATE POLICY "public_read_approved_companies" ON companies FOR SELECT TO anon, authenticated USING (status = 'approved');
DROP POLICY IF EXISTS "auth_insert_companies" ON companies;
CREATE POLICY "auth_insert_companies" ON companies FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_own_company" ON companies;
CREATE POLICY "auth_update_own_company" ON companies FOR UPDATE TO authenticated USING (auth.uid() = user_id OR user_id IS NULL) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_companies" ON companies;
CREATE POLICY "auth_delete_companies" ON companies FOR DELETE TO authenticated USING (auth.uid() = user_id OR user_id IS NULL);

-- Students
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

ALTER TABLE students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "students_read_own" ON students;
CREATE POLICY "students_read_own" ON students FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "students_insert_own" ON students;
CREATE POLICY "students_insert_own" ON students FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "students_update_own" ON students;
CREATE POLICY "students_update_own" ON students FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "students_delete_own" ON students;
CREATE POLICY "students_delete_own" ON students FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Workshops
CREATE TABLE IF NOT EXISTS workshops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thumbnail_url text,
  banner_url text,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
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

ALTER TABLE workshops ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_active_workshops" ON workshops;
CREATE POLICY "public_read_active_workshops" ON workshops FOR SELECT TO anon, authenticated USING (status = 'active');
DROP POLICY IF EXISTS "auth_insert_workshops" ON workshops;
CREATE POLICY "auth_insert_workshops" ON workshops FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_workshops" ON workshops;
CREATE POLICY "auth_update_workshops" ON workshops FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_workshops" ON workshops;
CREATE POLICY "auth_delete_workshops" ON workshops FOR DELETE TO authenticated USING (true);

-- Internships
CREATE TABLE IF NOT EXISTS internships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thumbnail_url text,
  company_logo_url text,
  banner_url text,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
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

ALTER TABLE internships ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_open_internships" ON internships;
CREATE POLICY "public_read_open_internships" ON internships FOR SELECT TO anon, authenticated USING (status = 'open');
DROP POLICY IF EXISTS "auth_insert_internships" ON internships;
CREATE POLICY "auth_insert_internships" ON internships FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_internships" ON internships;
CREATE POLICY "auth_update_internships" ON internships FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_internships" ON internships;
CREATE POLICY "auth_delete_internships" ON internships FOR DELETE TO authenticated USING (true);

-- Workshop Applications
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

-- Internship Applications
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

-- Certificates
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

ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_certificates" ON certificates;
CREATE POLICY "public_read_certificates" ON certificates FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_certificates" ON certificates;
CREATE POLICY "auth_insert_certificates" ON certificates FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_certificates" ON certificates;
CREATE POLICY "auth_update_certificates" ON certificates FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_certificates" ON certificates;
CREATE POLICY "auth_delete_certificates" ON certificates FOR DELETE TO authenticated USING (true);

-- Payments
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

-- Attendance
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

-- Assignments
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

ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_assignments" ON assignments;
CREATE POLICY "public_read_assignments" ON assignments FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_assignments" ON assignments;
CREATE POLICY "auth_insert_assignments" ON assignments FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_assignments" ON assignments;
CREATE POLICY "auth_update_assignments" ON assignments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_assignments" ON assignments;
CREATE POLICY "auth_delete_assignments" ON assignments FOR DELETE TO authenticated USING (true);

-- Notifications
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

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_read_own_notifications" ON notifications;
CREATE POLICY "users_read_own_notifications" ON notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "auth_insert_notifications" ON notifications;
CREATE POLICY "auth_insert_notifications" ON notifications FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "users_update_own_notifications" ON notifications;
CREATE POLICY "users_update_own_notifications" ON notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (true);
DROP POLICY IF EXISTS "users_delete_own_notifications" ON notifications;
CREATE POLICY "users_delete_own_notifications" ON notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Company Partnership Requests
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_workshops_status ON workshops(status);
CREATE INDEX IF NOT EXISTS idx_workshops_category ON workshops(category_id);
CREATE INDEX IF NOT EXISTS idx_internships_status ON internships(status);
CREATE INDEX IF NOT EXISTS idx_internships_company ON internships(company_id);
CREATE INDEX IF NOT EXISTS idx_workshop_applications_student ON workshop_applications(student_id);
CREATE INDEX IF NOT EXISTS idx_internship_applications_student ON internship_applications(student_id);
CREATE INDEX IF NOT EXISTS idx_certificates_number ON certificates(certificate_number);
CREATE INDEX IF NOT EXISTS idx_students_user ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

-- Seed default categories
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
