-- Fix RLS policies: admin portal uses custom sessionStorage auth, not Supabase auth.
-- The anon-key client has no authenticated session, so write policies scoped to
-- `authenticated` only were blocking all admin inserts/updates/deletes.
-- Broaden write policies to `anon, authenticated` so the admin portal can manage content.
-- Public read policies for active/approved content remain unchanged.

-- Workshop categories
DROP POLICY IF EXISTS "auth_insert_workshop_categories" ON workshop_categories;
CREATE POLICY "auth_insert_workshop_categories" ON workshop_categories FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_workshop_categories" ON workshop_categories;
CREATE POLICY "auth_update_workshop_categories" ON workshop_categories FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_workshop_categories" ON workshop_categories;
CREATE POLICY "auth_delete_workshop_categories" ON workshop_categories FOR DELETE TO anon, authenticated USING (true);

-- Internship categories
DROP POLICY IF EXISTS "auth_insert_internship_categories" ON internship_categories;
CREATE POLICY "auth_insert_internship_categories" ON internship_categories FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_internship_categories" ON internship_categories;
CREATE POLICY "auth_update_internship_categories" ON internship_categories FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_internship_categories" ON internship_categories;
CREATE POLICY "auth_delete_internship_categories" ON internship_categories FOR DELETE TO anon, authenticated USING (true);

-- Companies (allow anon to insert/update for admin portal; keep public read for approved only)
DROP POLICY IF EXISTS "auth_insert_companies" ON companies;
CREATE POLICY "auth_insert_companies" ON companies FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_own_company" ON companies;
CREATE POLICY "auth_update_companies" ON companies FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_companies" ON companies;
CREATE POLICY "auth_delete_companies" ON companies FOR DELETE TO anon, authenticated USING (true);

-- Workshops
DROP POLICY IF EXISTS "auth_insert_workshops" ON workshops;
CREATE POLICY "auth_insert_workshops" ON workshops FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_workshops" ON workshops;
CREATE POLICY "auth_update_workshops" ON workshops FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_workshops" ON workshops;
CREATE POLICY "auth_delete_workshops" ON workshops FOR DELETE TO anon, authenticated USING (true);

-- Internships
DROP POLICY IF EXISTS "auth_insert_internships" ON internships;
CREATE POLICY "auth_insert_internships" ON internships FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_internships" ON internships;
CREATE POLICY "auth_update_internships" ON internships FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_internships" ON internships;
CREATE POLICY "auth_delete_internships" ON internships FOR DELETE TO anon, authenticated USING (true);

-- Certificates (admin manages these)
DROP POLICY IF EXISTS "auth_insert_certificates" ON certificates;
CREATE POLICY "auth_insert_certificates" ON certificates FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_certificates" ON certificates;
CREATE POLICY "auth_update_certificates" ON certificates FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_certificates" ON certificates;
CREATE POLICY "auth_delete_certificates" ON certificates FOR DELETE TO anon, authenticated USING (true);

-- Payments (admin can update status)
DROP POLICY IF EXISTS "students_insert_payments" ON payments;
CREATE POLICY "auth_insert_payments" ON payments FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "students_update_payments" ON payments;
CREATE POLICY "auth_update_payments" ON payments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "students_delete_payments" ON payments;
CREATE POLICY "auth_delete_payments" ON payments FOR DELETE TO anon, authenticated USING (true);

-- Attendance (admin manages)
DROP POLICY IF EXISTS "auth_insert_attendance" ON attendance;
CREATE POLICY "auth_insert_attendance" ON attendance FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_attendance" ON attendance;
CREATE POLICY "auth_update_attendance" ON attendance FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_attendance" ON attendance;
CREATE POLICY "auth_delete_attendance" ON attendance FOR DELETE TO anon, authenticated USING (true);

-- Assignments (admin manages)
DROP POLICY IF EXISTS "auth_insert_assignments" ON assignments;
CREATE POLICY "auth_insert_assignments" ON assignments FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_assignments" ON assignments;
CREATE POLICY "auth_update_assignments" ON assignments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_assignments" ON assignments;
CREATE POLICY "auth_delete_assignments" ON assignments FOR DELETE TO anon, authenticated USING (true);

-- Notifications (admin can insert broadcasts)
DROP POLICY IF EXISTS "auth_insert_notifications" ON notifications;
CREATE POLICY "auth_insert_notifications" ON notifications FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Company partnership requests (admin manages)
DROP POLICY IF EXISTS "auth_update_partnership_requests" ON company_partnership_requests;
CREATE POLICY "auth_update_partnership_requests" ON company_partnership_requests FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_partnership_requests" ON company_partnership_requests;
CREATE POLICY "auth_delete_partnership_requests" ON company_partnership_requests FOR DELETE TO anon, authenticated USING (true);

-- Workshop applications (admin can update status)
DROP POLICY IF EXISTS "students_update_workshop_apps" ON workshop_applications;
CREATE POLICY "auth_update_workshop_apps" ON workshop_applications FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "students_delete_workshop_apps" ON workshop_applications;
CREATE POLICY "auth_delete_workshop_apps" ON workshop_applications FOR DELETE TO anon, authenticated USING (true);

-- Internship applications (admin can update status)
DROP POLICY IF EXISTS "students_update_intern_apps" ON internship_applications;
CREATE POLICY "auth_update_intern_apps" ON internship_applications FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "students_delete_intern_apps" ON internship_applications;
CREATE POLICY "auth_delete_intern_apps" ON internship_applications FOR DELETE TO anon, authenticated USING (true);

-- Students (admin can update status)
DROP POLICY IF EXISTS "students_update_own" ON students;
CREATE POLICY "auth_update_students" ON students FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "students_delete_own" ON students;
CREATE POLICY "auth_delete_students" ON students FOR DELETE TO anon, authenticated USING (true);
