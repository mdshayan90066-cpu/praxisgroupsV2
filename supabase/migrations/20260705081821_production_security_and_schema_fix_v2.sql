/*
# Production Security & Schema Fix (v2)

Fixes typo from v1. Creates role system, new tables, and fixes all RLS policies.
See v1 migration for full documentation.
*/

-- ============================================================
-- 1. ROLE HELPER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION public.has_role(role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role') = role,
    false
  );
$$;

-- ============================================================
-- 2. NEW TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS company_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  role text NOT NULL DEFAULT 'manager' CHECK (role IN ('admin', 'manager', 'recruiter')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE company_users ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'responded', 'archived')),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject text NOT NULL,
  description text NOT NULL,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS support_ticket_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  replied_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  message text NOT NULL,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE support_ticket_replies ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sent_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  subject text NOT NULL,
  body text NOT NULL,
  audience text NOT NULL CHECK (audience IN ('all_students', 'active_students', 'all_companies', 'approved_companies', 'custom')),
  recipient_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'logged' CHECK (status IN ('logged', 'sent', 'failed')),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  reason text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed')),
  razorpay_refund_id text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS assignment_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  submission_url text,
  submission_text text,
  marks integer,
  feedback text,
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'late', 'resubmitted')),
  submitted_at timestamptz DEFAULT now(),
  graded_at timestamptz,
  UNIQUE(assignment_id, student_id)
);
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. FIX ALL RLS POLICIES
-- ============================================================

-- Workshop Categories
DROP POLICY IF EXISTS "auth_insert_workshop_categories" ON workshop_categories;
DROP POLICY IF EXISTS "admin_insert_workshop_categories" ON workshop_categories;
CREATE POLICY "admin_insert_workshop_categories" ON workshop_categories FOR INSERT TO authenticated WITH CHECK (public.has_role('admin'));
DROP POLICY IF EXISTS "auth_update_workshop_categories" ON workshop_categories;
DROP POLICY IF EXISTS "admin_update_workshop_categories" ON workshop_categories;
CREATE POLICY "admin_update_workshop_categories" ON workshop_categories FOR UPDATE TO authenticated USING (public.has_role('admin')) WITH CHECK (public.has_role('admin'));
DROP POLICY IF EXISTS "auth_delete_workshop_categories" ON workshop_categories;
DROP POLICY IF EXISTS "admin_delete_workshop_categories" ON workshop_categories;
CREATE POLICY "admin_delete_workshop_categories" ON workshop_categories FOR DELETE TO authenticated USING (public.has_role('admin'));

-- Internship Categories
DROP POLICY IF EXISTS "auth_insert_internship_categories" ON internship_categories;
DROP POLICY IF EXISTS "admin_insert_internship_categories" ON internship_categories;
CREATE POLICY "admin_insert_internship_categories" ON internship_categories FOR INSERT TO authenticated WITH CHECK (public.has_role('admin'));
DROP POLICY IF EXISTS "auth_update_internship_categories" ON internship_categories;
DROP POLICY IF EXISTS "admin_update_internship_categories" ON internship_categories;
CREATE POLICY "admin_update_internship_categories" ON internship_categories FOR UPDATE TO authenticated USING (public.has_role('admin')) WITH CHECK (public.has_role('admin'));
DROP POLICY IF EXISTS "auth_delete_internship_categories" ON internship_categories;
DROP POLICY IF EXISTS "admin_delete_internship_categories" ON internship_categories;
CREATE POLICY "admin_delete_internship_categories" ON internship_categories FOR DELETE TO authenticated USING (public.has_role('admin'));

-- Companies
DROP POLICY IF EXISTS "auth_insert_companies" ON companies;
DROP POLICY IF EXISTS "admin_insert_companies" ON companies;
CREATE POLICY "admin_insert_companies" ON companies FOR INSERT TO authenticated WITH CHECK (public.has_role('admin'));
DROP POLICY IF EXISTS "auth_update_companies" ON companies;
DROP POLICY IF EXISTS "admin_update_companies" ON companies;
CREATE POLICY "admin_update_companies" ON companies FOR UPDATE TO authenticated USING (public.has_role('admin')) WITH CHECK (public.has_role('admin'));
DROP POLICY IF EXISTS "auth_delete_companies" ON companies;
DROP POLICY IF EXISTS "admin_delete_companies" ON companies;
CREATE POLICY "admin_delete_companies" ON companies FOR DELETE TO authenticated USING (public.has_role('admin'));
DROP POLICY IF EXISTS "public_read_approved_companies" ON companies;
DROP POLICY IF EXISTS "read_companies" ON companies;
CREATE POLICY "read_companies" ON companies FOR SELECT TO anon, authenticated USING (
  status = 'approved' OR public.has_role('admin') OR
  EXISTS (SELECT 1 FROM company_users WHERE company_users.user_id = auth.uid() AND company_users.company_id = companies.id)
);

-- Workshops
DROP POLICY IF EXISTS "auth_insert_workshops" ON workshops;
DROP POLICY IF EXISTS "admin_insert_workshops" ON workshops;
CREATE POLICY "admin_insert_workshops" ON workshops FOR INSERT TO authenticated WITH CHECK (public.has_role('admin'));
DROP POLICY IF EXISTS "auth_update_workshops" ON workshops;
DROP POLICY IF EXISTS "admin_update_workshops" ON workshops;
CREATE POLICY "admin_update_workshops" ON workshops FOR UPDATE TO authenticated USING (public.has_role('admin')) WITH CHECK (public.has_role('admin'));
DROP POLICY IF EXISTS "auth_delete_workshops" ON workshops;
DROP POLICY IF EXISTS "admin_delete_workshops" ON workshops;
CREATE POLICY "admin_delete_workshops" ON workshops FOR DELETE TO authenticated USING (public.has_role('admin'));

-- Internships
DROP POLICY IF EXISTS "auth_insert_internships" ON internships;
DROP POLICY IF EXISTS "manage_insert_internships" ON internships;
CREATE POLICY "manage_insert_internships" ON internships FOR INSERT TO authenticated WITH CHECK (public.has_role('admin') OR public.has_role('company'));
DROP POLICY IF EXISTS "auth_update_internships" ON internships;
DROP POLICY IF EXISTS "manage_update_internships" ON internships;
CREATE POLICY "manage_update_internships" ON internships FOR UPDATE TO authenticated USING (
  public.has_role('admin') OR
  EXISTS (SELECT 1 FROM company_users WHERE company_users.user_id = auth.uid() AND company_users.company_id = internships.company_id)
) WITH CHECK (public.has_role('admin') OR public.has_role('company'));
DROP POLICY IF EXISTS "auth_delete_internships" ON internships;
DROP POLICY IF EXISTS "admin_delete_internships" ON internships;
CREATE POLICY "admin_delete_internships" ON internships FOR DELETE TO authenticated USING (public.has_role('admin'));

-- Certificates
DROP POLICY IF EXISTS "auth_insert_certificates" ON certificates;
DROP POLICY IF EXISTS "admin_insert_certificates" ON certificates;
CREATE POLICY "admin_insert_certificates" ON certificates FOR INSERT TO authenticated WITH CHECK (public.has_role('admin'));
DROP POLICY IF EXISTS "auth_update_certificates" ON certificates;
DROP POLICY IF EXISTS "admin_update_certificates" ON certificates;
CREATE POLICY "admin_update_certificates" ON certificates FOR UPDATE TO authenticated USING (public.has_role('admin')) WITH CHECK (public.has_role('admin'));
DROP POLICY IF EXISTS "auth_delete_certificates" ON certificates;
DROP POLICY IF EXISTS "admin_delete_certificates" ON certificates;
CREATE POLICY "admin_delete_certificates" ON certificates FOR DELETE TO authenticated USING (public.has_role('admin'));

-- Payments
DROP POLICY IF EXISTS "auth_insert_payments" ON payments;
DROP POLICY IF EXISTS "students_insert_payments" ON payments;
CREATE POLICY "students_insert_payments" ON payments FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM students WHERE students.id = payments.student_id AND students.user_id = auth.uid())
);
DROP POLICY IF EXISTS "auth_update_payments" ON payments;
DROP POLICY IF EXISTS "admin_update_payments" ON payments;
CREATE POLICY "admin_update_payments" ON payments FOR UPDATE TO authenticated USING (public.has_role('admin')) WITH CHECK (public.has_role('admin'));
DROP POLICY IF EXISTS "auth_delete_payments" ON payments;
DROP POLICY IF EXISTS "admin_delete_payments" ON payments;
CREATE POLICY "admin_delete_payments" ON payments FOR DELETE TO authenticated USING (public.has_role('admin'));

-- Attendance
DROP POLICY IF EXISTS "auth_insert_attendance" ON attendance;
DROP POLICY IF EXISTS "admin_insert_attendance" ON attendance;
CREATE POLICY "admin_insert_attendance" ON attendance FOR INSERT TO authenticated WITH CHECK (public.has_role('admin'));
DROP POLICY IF EXISTS "auth_update_attendance" ON attendance;
DROP POLICY IF EXISTS "admin_update_attendance" ON attendance;
CREATE POLICY "admin_update_attendance" ON attendance FOR UPDATE TO authenticated USING (public.has_role('admin')) WITH CHECK (public.has_role('admin'));
DROP POLICY IF EXISTS "auth_delete_attendance" ON attendance;
DROP POLICY IF EXISTS "admin_delete_attendance" ON attendance;
CREATE POLICY "admin_delete_attendance" ON attendance FOR DELETE TO authenticated USING (public.has_role('admin'));

-- Assignments
DROP POLICY IF EXISTS "auth_insert_assignments" ON assignments;
DROP POLICY IF EXISTS "admin_insert_assignments" ON assignments;
CREATE POLICY "admin_insert_assignments" ON assignments FOR INSERT TO authenticated WITH CHECK (public.has_role('admin'));
DROP POLICY IF EXISTS "auth_update_assignments" ON assignments;
DROP POLICY IF EXISTS "admin_update_assignments" ON assignments;
CREATE POLICY "admin_update_assignments" ON assignments FOR UPDATE TO authenticated USING (public.has_role('admin')) WITH CHECK (public.has_role('admin'));
DROP POLICY IF EXISTS "auth_delete_assignments" ON assignments;
DROP POLICY IF EXISTS "admin_delete_assignments" ON assignments;
CREATE POLICY "admin_delete_assignments" ON assignments FOR DELETE TO authenticated USING (public.has_role('admin'));

-- Notifications
DROP POLICY IF EXISTS "auth_insert_notifications" ON notifications;
DROP POLICY IF EXISTS "admin_insert_notifications" ON notifications;
CREATE POLICY "admin_insert_notifications" ON notifications FOR INSERT TO authenticated WITH CHECK (public.has_role('admin'));

-- Partnership requests
DROP POLICY IF EXISTS "auth_read_partnership_requests" ON company_partnership_requests;
DROP POLICY IF EXISTS "admin_read_partnership_requests" ON company_partnership_requests;
CREATE POLICY "admin_read_partnership_requests" ON company_partnership_requests FOR SELECT TO authenticated USING (public.has_role('admin'));
DROP POLICY IF EXISTS "auth_update_partnership_requests" ON company_partnership_requests;
DROP POLICY IF EXISTS "admin_update_partnership_requests" ON company_partnership_requests;
CREATE POLICY "admin_update_partnership_requests" ON company_partnership_requests FOR UPDATE TO authenticated USING (public.has_role('admin')) WITH CHECK (public.has_role('admin'));
DROP POLICY IF EXISTS "auth_delete_partnership_requests" ON company_partnership_requests;
DROP POLICY IF EXISTS "admin_delete_partnership_requests" ON company_partnership_requests;
CREATE POLICY "admin_delete_partnership_requests" ON company_partnership_requests FOR DELETE TO authenticated USING (public.has_role('admin'));

-- Workshop applications
DROP POLICY IF EXISTS "auth_update_workshop_apps" ON workshop_applications;
DROP POLICY IF EXISTS "manage_update_workshop_apps" ON workshop_applications;
CREATE POLICY "manage_update_workshop_apps" ON workshop_applications FOR UPDATE TO authenticated USING (
  public.has_role('admin') OR
  EXISTS (SELECT 1 FROM students WHERE students.id = workshop_applications.student_id AND students.user_id = auth.uid())
) WITH CHECK (
  public.has_role('admin') OR
  EXISTS (SELECT 1 FROM students WHERE students.id = workshop_applications.student_id AND students.user_id = auth.uid())
);
DROP POLICY IF EXISTS "auth_delete_workshop_apps" ON workshop_applications;
DROP POLICY IF EXISTS "admin_delete_workshop_apps" ON workshop_applications;
CREATE POLICY "admin_delete_workshop_apps" ON workshop_applications FOR DELETE TO authenticated USING (public.has_role('admin'));

-- Internship applications
DROP POLICY IF EXISTS "auth_update_intern_apps" ON internship_applications;
DROP POLICY IF EXISTS "manage_update_intern_apps" ON internship_applications;
CREATE POLICY "manage_update_intern_apps" ON internship_applications FOR UPDATE TO authenticated USING (
  public.has_role('admin') OR
  EXISTS (SELECT 1 FROM students WHERE students.id = internship_applications.student_id AND students.user_id = auth.uid())
) WITH CHECK (
  public.has_role('admin') OR
  EXISTS (SELECT 1 FROM students WHERE students.id = internship_applications.student_id AND students.user_id = auth.uid())
);
DROP POLICY IF EXISTS "auth_delete_intern_apps" ON internship_applications;
DROP POLICY IF EXISTS "admin_delete_intern_apps" ON internship_applications;
CREATE POLICY "admin_delete_intern_apps" ON internship_applications FOR DELETE TO authenticated USING (public.has_role('admin'));
DROP POLICY IF EXISTS "students_read_own_intern_apps" ON internship_applications;
DROP POLICY IF EXISTS "read_intern_apps" ON internship_applications;
CREATE POLICY "read_intern_apps" ON internship_applications FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM students WHERE students.id = internship_applications.student_id AND students.user_id = auth.uid()) OR
  public.has_role('admin') OR
  EXISTS (
    SELECT 1 FROM internship_applications ia
    JOIN internships i ON i.id = ia.internship_id
    JOIN company_users cu ON cu.company_id = i.company_id
    WHERE cu.user_id = auth.uid() AND ia.id = internship_applications.id
  )
);

-- Students
DROP POLICY IF EXISTS "auth_update_students" ON students;
DROP POLICY IF EXISTS "manage_update_students" ON students;
CREATE POLICY "manage_update_students" ON students FOR UPDATE TO authenticated USING (
  auth.uid() = user_id OR public.has_role('admin')
) WITH CHECK (auth.uid() = user_id OR public.has_role('admin'));
DROP POLICY IF EXISTS "auth_delete_students" ON students;
DROP POLICY IF EXISTS "admin_delete_students" ON students;
CREATE POLICY "admin_delete_students" ON students FOR DELETE TO authenticated USING (public.has_role('admin'));
DROP POLICY IF EXISTS "students_read_own" ON students;
DROP POLICY IF EXISTS "read_students" ON students;
CREATE POLICY "read_students" ON students FOR SELECT TO authenticated USING (
  auth.uid() = user_id OR public.has_role('admin') OR
  EXISTS (SELECT 1 FROM company_users WHERE company_users.user_id = auth.uid())
);

-- ============================================================
-- 4. RLS FOR NEW TABLES
-- ============================================================

-- Company Users
DROP POLICY IF EXISTS "read_company_users" ON company_users;
CREATE POLICY "read_company_users" ON company_users FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role('admin'));
DROP POLICY IF EXISTS "admin_insert_company_users" ON company_users;
CREATE POLICY "admin_insert_company_users" ON company_users FOR INSERT TO authenticated WITH CHECK (public.has_role('admin'));
DROP POLICY IF EXISTS "admin_update_company_users" ON company_users;
DROP POLICY IF EXISTS "manage_update_company_users" ON company_users;
CREATE POLICY "manage_update_company_users" ON company_users FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role('admin')) WITH CHECK (auth.uid() = user_id OR public.has_role('admin'));
DROP POLICY IF EXISTS "admin_delete_company_users" ON company_users;
CREATE POLICY "admin_delete_company_users" ON company_users FOR DELETE TO authenticated USING (public.has_role('admin'));

-- Contact Messages
DROP POLICY IF EXISTS "anon_insert_contact" ON contact_messages;
CREATE POLICY "anon_insert_contact" ON contact_messages FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "admin_read_contact" ON contact_messages;
CREATE POLICY "admin_read_contact" ON contact_messages FOR SELECT TO authenticated USING (public.has_role('admin'));
DROP POLICY IF EXISTS "admin_update_contact" ON contact_messages;
CREATE POLICY "admin_update_contact" ON contact_messages FOR UPDATE TO authenticated USING (public.has_role('admin')) WITH CHECK (public.has_role('admin'));
DROP POLICY IF EXISTS "admin_delete_contact" ON contact_messages;
CREATE POLICY "admin_delete_contact" ON contact_messages FOR DELETE TO authenticated USING (public.has_role('admin'));

-- Support Tickets
DROP POLICY IF EXISTS "student_read_tickets" ON support_tickets;
DROP POLICY IF EXISTS "read_tickets" ON support_tickets;
CREATE POLICY "read_tickets" ON support_tickets FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM students WHERE students.id = support_tickets.student_id AND students.user_id = auth.uid()) OR public.has_role('admin')
);
DROP POLICY IF EXISTS "student_insert_tickets" ON support_tickets;
CREATE POLICY "student_insert_tickets" ON support_tickets FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM students WHERE students.id = support_tickets.student_id AND students.user_id = auth.uid())
);
DROP POLICY IF EXISTS "admin_update_tickets" ON support_tickets;
DROP POLICY IF EXISTS "manage_update_tickets" ON support_tickets;
CREATE POLICY "manage_update_tickets" ON support_tickets FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM students WHERE students.id = support_tickets.student_id AND students.user_id = auth.uid()) OR public.has_role('admin')
) WITH CHECK (public.has_role('admin'));

-- Support Ticket Replies
DROP POLICY IF EXISTS "read_ticket_replies" ON support_ticket_replies;
CREATE POLICY "read_ticket_replies" ON support_ticket_replies FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM support_tickets st JOIN students s ON s.id = st.student_id WHERE st.id = support_ticket_replies.ticket_id AND s.user_id = auth.uid()) OR public.has_role('admin')
);
DROP POLICY IF EXISTS "insert_ticket_replies" ON support_ticket_replies;
CREATE POLICY "insert_ticket_replies" ON support_ticket_replies FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM support_tickets st JOIN students s ON s.id = st.student_id WHERE st.id = support_ticket_replies.ticket_id AND s.user_id = auth.uid()) OR public.has_role('admin')
);

-- Audit Logs
DROP POLICY IF EXISTS "admin_read_audit" ON audit_logs;
CREATE POLICY "admin_read_audit" ON audit_logs FOR SELECT TO authenticated USING (public.has_role('admin'));
DROP POLICY IF EXISTS "admin_insert_audit" ON audit_logs;
CREATE POLICY "admin_insert_audit" ON audit_logs FOR INSERT TO authenticated WITH CHECK (public.has_role('admin'));

-- Email Logs
DROP POLICY IF EXISTS "admin_read_email_logs" ON email_logs;
CREATE POLICY "admin_read_email_logs" ON email_logs FOR SELECT TO authenticated USING (public.has_role('admin'));
DROP POLICY IF EXISTS "admin_insert_email_logs" ON email_logs;
CREATE POLICY "admin_insert_email_logs" ON email_logs FOR INSERT TO authenticated WITH CHECK (public.has_role('admin'));

-- App Settings
DROP POLICY IF EXISTS "read_settings" ON app_settings;
CREATE POLICY "read_settings" ON app_settings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "admin_insert_settings" ON app_settings;
CREATE POLICY "admin_insert_settings" ON app_settings FOR INSERT TO authenticated WITH CHECK (public.has_role('admin'));
DROP POLICY IF EXISTS "admin_update_settings" ON app_settings;
CREATE POLICY "admin_update_settings" ON app_settings FOR UPDATE TO authenticated USING (public.has_role('admin')) WITH CHECK (public.has_role('admin'));

-- Refunds
DROP POLICY IF EXISTS "admin_read_refunds" ON refunds;
CREATE POLICY "admin_read_refunds" ON refunds FOR SELECT TO authenticated USING (public.has_role('admin'));
DROP POLICY IF EXISTS "admin_insert_refunds" ON refunds;
CREATE POLICY "admin_insert_refunds" ON refunds FOR INSERT TO authenticated WITH CHECK (public.has_role('admin'));
DROP POLICY IF EXISTS "admin_update_refunds" ON refunds;
CREATE POLICY "admin_update_refunds" ON refunds FOR UPDATE TO authenticated USING (public.has_role('admin')) WITH CHECK (public.has_role('admin'));

-- Assignment Submissions
DROP POLICY IF EXISTS "read_submissions" ON assignment_submissions;
CREATE POLICY "read_submissions" ON assignment_submissions FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM students WHERE students.id = assignment_submissions.student_id AND students.user_id = auth.uid()) OR public.has_role('admin')
);
DROP POLICY IF EXISTS "student_insert_submissions" ON assignment_submissions;
CREATE POLICY "student_insert_submissions" ON assignment_submissions FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM students WHERE students.id = assignment_submissions.student_id AND students.user_id = auth.uid())
);
DROP POLICY IF EXISTS "admin_update_submissions" ON assignment_submissions;
CREATE POLICY "admin_update_submissions" ON assignment_submissions FOR UPDATE TO authenticated USING (public.has_role('admin')) WITH CHECK (public.has_role('admin'));

-- ============================================================
-- 5. INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_company_users_user ON company_users(user_id);
CREATE INDEX IF NOT EXISTS idx_company_users_company ON company_users(company_id);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_student ON support_tickets(student_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_created ON email_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_refunds_payment ON refunds(payment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_student ON assignment_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment ON assignment_submissions(assignment_id);

-- ============================================================
-- 6. SEED SETTINGS
-- ============================================================
INSERT INTO app_settings (key, value, description) VALUES
  ('site_name', 'Praxis Group', 'Site display name'),
  ('contact_email', 'contact@praxisgroup.online', 'Public contact email'),
  ('gst_rate', '18', 'GST percentage for checkout'),
  ('currency', 'INR', 'Default currency code')
ON CONFLICT (key) DO NOTHING;
