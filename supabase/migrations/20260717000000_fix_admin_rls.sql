/*
  ============================================================
  PRAXIS GROUP — COMPLETE DATABASE FIX
  ============================================================
  
  This script:
  1. Drops ALL check constraints that conflict with the website code
  2. Recreates them with values matching what the admin UI actually sends
  3. Fixes RLS policies so the anon-key admin portal can read/write
  4. Safely skips tables that don't exist
  
  Run this ONCE in Supabase Dashboard → SQL Editor → New Query → Run
  ============================================================
*/

-- ============================================================
-- PART 1: FIX CHECK CONSTRAINTS
-- Drop and recreate every check constraint to match website code
-- ============================================================

DO $$
DECLARE
  rec record;
BEGIN

-- ── INTERNSHIPS ──────────────────────────────────────────────
IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='internships') THEN
  -- Drop ALL check constraints on internships safely
  FOR rec IN SELECT conname FROM pg_constraint WHERE conrelid = 'public.internships'::regclass AND contype = 'c'
  LOOP
    EXECUTE 'ALTER TABLE internships DROP CONSTRAINT IF EXISTS ' || quote_ident(rec.conname);
  END LOOP;
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name='internships' AND column_name='status') THEN
    ALTER TABLE internships ADD CONSTRAINT internships_status_check CHECK (status IN ('draft', 'open', 'closed', 'archived', 'active'));
  END IF;
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name='internships' AND column_name='work_mode') THEN
    ALTER TABLE internships ADD CONSTRAINT internships_work_mode_check CHECK (work_mode IN ('remote', 'hybrid', 'on-site'));
  END IF;
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name='internships' AND column_name='stipend_type') THEN
    ALTER TABLE internships ADD CONSTRAINT internships_stipend_type_check CHECK (stipend_type IN ('paid', 'unpaid'));
  END IF;
END IF;

-- ── WORKSHOPS ────────────────────────────────────────────────
IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='workshops') THEN
  FOR rec IN SELECT conname FROM pg_constraint WHERE conrelid = 'public.workshops'::regclass AND contype = 'c'
  LOOP
    EXECUTE 'ALTER TABLE workshops DROP CONSTRAINT IF EXISTS ' || quote_ident(rec.conname);
  END LOOP;
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name='workshops' AND column_name='status') THEN
    ALTER TABLE workshops ADD CONSTRAINT workshops_status_check CHECK (status IN ('draft', 'active', 'closed', 'archived'));
  END IF;
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name='workshops' AND column_name='workshop_type') THEN
    ALTER TABLE workshops ADD CONSTRAINT workshops_workshop_type_check CHECK (workshop_type IN ('online', 'offline', 'hybrid'));
  END IF;
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name='workshops' AND column_name='price_type') THEN
    ALTER TABLE workshops ADD CONSTRAINT workshops_price_type_check CHECK (price_type IN ('free', 'paid'));
  END IF;
END IF;

-- ── COMPANIES ────────────────────────────────────────────────
IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='companies') THEN
  FOR rec IN SELECT conname FROM pg_constraint WHERE conrelid = 'public.companies'::regclass AND contype = 'c'
  LOOP
    EXECUTE 'ALTER TABLE companies DROP CONSTRAINT IF EXISTS ' || quote_ident(rec.conname);
  END LOOP;
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name='companies' AND column_name='status') THEN
    ALTER TABLE companies ADD CONSTRAINT companies_status_check CHECK (status IN ('pending', 'approved', 'rejected', 'suspended'));
  END IF;
END IF;

-- ── STUDENTS ─────────────────────────────────────────────────
IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='students') THEN
  FOR rec IN SELECT conname FROM pg_constraint WHERE conrelid = 'public.students'::regclass AND contype = 'c'
  LOOP
    EXECUTE 'ALTER TABLE students DROP CONSTRAINT IF EXISTS ' || quote_ident(rec.conname);
  END LOOP;
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name='students' AND column_name='status') THEN
    ALTER TABLE students ADD CONSTRAINT students_status_check CHECK (status IN ('active', 'suspended', 'deleted'));
  END IF;
END IF;

-- ── CERTIFICATES ─────────────────────────────────────────────
IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='certificates') THEN
  FOR rec IN SELECT conname FROM pg_constraint WHERE conrelid = 'public.certificates'::regclass AND contype = 'c'
  LOOP
    EXECUTE 'ALTER TABLE certificates DROP CONSTRAINT IF EXISTS ' || quote_ident(rec.conname);
  END LOOP;
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name='certificates' AND column_name='status') THEN
    ALTER TABLE certificates ADD CONSTRAINT certificates_status_check CHECK (status IN ('active', 'revoked', 'expired'));
  END IF;
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name='certificates' AND column_name='program_type') THEN
    ALTER TABLE certificates ADD CONSTRAINT certificates_program_type_check CHECK (program_type IN ('workshop', 'internship'));
  END IF;
END IF;

-- ── PAYMENTS ─────────────────────────────────────────────────
IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='payments') THEN
  FOR rec IN SELECT conname FROM pg_constraint WHERE conrelid = 'public.payments'::regclass AND contype = 'c'
  LOOP
    EXECUTE 'ALTER TABLE payments DROP CONSTRAINT IF EXISTS ' || quote_ident(rec.conname);
  END LOOP;
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name='payments' AND column_name='status') THEN
    ALTER TABLE payments ADD CONSTRAINT payments_status_check CHECK (status IN ('pending', 'successful', 'failed', 'refunded'));
  END IF;
END IF;

-- ── WORKSHOP APPLICATIONS ────────────────────────────────────
IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='workshop_applications') THEN
  FOR rec IN SELECT conname FROM pg_constraint WHERE conrelid = 'public.workshop_applications'::regclass AND contype = 'c'
  LOOP
    EXECUTE 'ALTER TABLE workshop_applications DROP CONSTRAINT IF EXISTS ' || quote_ident(rec.conname);
  END LOOP;
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name='workshop_applications' AND column_name='status') THEN
    ALTER TABLE workshop_applications ADD CONSTRAINT workshop_applications_status_check CHECK (status IN ('pending', 'accepted', 'rejected', 'completed', 'payment_pending', 'paid'));
  END IF;
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name='workshop_applications' AND column_name='payment_status') THEN
    ALTER TABLE workshop_applications ADD CONSTRAINT workshop_applications_payment_status_check CHECK (payment_status IN ('not_required', 'pending', 'successful', 'failed', 'refunded'));
  END IF;
END IF;

-- ── INTERNSHIP APPLICATIONS ──────────────────────────────────
IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='internship_applications') THEN
  FOR rec IN SELECT conname FROM pg_constraint WHERE conrelid = 'public.internship_applications'::regclass AND contype = 'c'
  LOOP
    EXECUTE 'ALTER TABLE internship_applications DROP CONSTRAINT IF EXISTS ' || quote_ident(rec.conname);
  END LOOP;
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name='internship_applications' AND column_name='status') THEN
    ALTER TABLE internship_applications ADD CONSTRAINT internship_applications_status_check CHECK (status IN ('pending', 'accepted', 'rejected', 'completed', 'interview_scheduled'));
  END IF;
END IF;

-- ── ATTENDANCE ───────────────────────────────────────────────
IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='attendance') THEN
  FOR rec IN SELECT conname FROM pg_constraint WHERE conrelid = 'public.attendance'::regclass AND contype = 'c'
  LOOP
    EXECUTE 'ALTER TABLE attendance DROP CONSTRAINT IF EXISTS ' || quote_ident(rec.conname);
  END LOOP;
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name='attendance' AND column_name='status') THEN
    ALTER TABLE attendance ADD CONSTRAINT attendance_status_check CHECK (status IN ('present', 'absent', 'late'));
  END IF;
END IF;

-- ── NOTIFICATIONS ────────────────────────────────────────────
IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='notifications') THEN
  FOR rec IN SELECT conname FROM pg_constraint WHERE conrelid = 'public.notifications'::regclass AND contype = 'c'
  LOOP
    EXECUTE 'ALTER TABLE notifications DROP CONSTRAINT IF EXISTS ' || quote_ident(rec.conname);
  END LOOP;
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name='notifications' AND column_name='type') THEN
    ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (type IN ('info', 'success', 'warning', 'error'));
  END IF;
END IF;

-- ── COMPANY PARTNERSHIP REQUESTS ─────────────────────────────
IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='company_partnership_requests') THEN
  FOR rec IN SELECT conname FROM pg_constraint WHERE conrelid = 'public.company_partnership_requests'::regclass AND contype = 'c'
  LOOP
    EXECUTE 'ALTER TABLE company_partnership_requests DROP CONSTRAINT IF EXISTS ' || quote_ident(rec.conname);
  END LOOP;
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name='company_partnership_requests' AND column_name='request_type') THEN
    ALTER TABLE company_partnership_requests ADD CONSTRAINT partnership_requests_request_type_check CHECK (request_type IN ('partnership', 'hire_interns', 'collaboration'));
  END IF;
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name='company_partnership_requests' AND column_name='status') THEN
    ALTER TABLE company_partnership_requests ADD CONSTRAINT partnership_requests_status_check CHECK (status IN ('pending', 'reviewed', 'accepted', 'rejected'));
  END IF;
END IF;

-- ── CONTACT MESSAGES ─────────────────────────────────────────
IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='contact_messages') THEN
  FOR rec IN SELECT conname FROM pg_constraint WHERE conrelid = 'public.contact_messages'::regclass AND contype = 'c'
  LOOP
    EXECUTE 'ALTER TABLE contact_messages DROP CONSTRAINT IF EXISTS ' || quote_ident(rec.conname);
  END LOOP;
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name='contact_messages' AND column_name='status') THEN
    ALTER TABLE contact_messages ADD CONSTRAINT contact_messages_status_check CHECK (status IN ('new', 'read', 'responded', 'archived'));
  END IF;
END IF;

-- ── SUPPORT TICKETS ──────────────────────────────────────────
IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='support_tickets') THEN
  FOR rec IN SELECT conname FROM pg_constraint WHERE conrelid = 'public.support_tickets'::regclass AND contype = 'c'
  LOOP
    EXECUTE 'ALTER TABLE support_tickets DROP CONSTRAINT IF EXISTS ' || quote_ident(rec.conname);
  END LOOP;
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name='support_tickets' AND column_name='priority') THEN
    ALTER TABLE support_tickets ADD CONSTRAINT support_tickets_priority_check CHECK (priority IN ('low', 'medium', 'high', 'urgent'));
  END IF;
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name='support_tickets' AND column_name='status') THEN
    ALTER TABLE support_tickets ADD CONSTRAINT support_tickets_status_check CHECK (status IN ('open', 'in_progress', 'resolved', 'closed'));
  END IF;
END IF;

-- ── COMPANY USERS ────────────────────────────────────────────
IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='company_users') THEN
  FOR rec IN SELECT conname FROM pg_constraint WHERE conrelid = 'public.company_users'::regclass AND contype = 'c'
  LOOP
    EXECUTE 'ALTER TABLE company_users DROP CONSTRAINT IF EXISTS ' || quote_ident(rec.conname);
  END LOOP;
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name='company_users' AND column_name='role') THEN
    ALTER TABLE company_users ADD CONSTRAINT company_users_role_check CHECK (role IN ('admin', 'manager', 'recruiter'));
  END IF;
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name='company_users' AND column_name='status') THEN
    ALTER TABLE company_users ADD CONSTRAINT company_users_status_check CHECK (status IN ('active', 'suspended', 'deleted'));
  END IF;
END IF;

-- ── EMAIL LOGS ───────────────────────────────────────────────
IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='email_logs') THEN
  FOR rec IN SELECT conname FROM pg_constraint WHERE conrelid = 'public.email_logs'::regclass AND contype = 'c'
  LOOP
    EXECUTE 'ALTER TABLE email_logs DROP CONSTRAINT IF EXISTS ' || quote_ident(rec.conname);
  END LOOP;
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name='email_logs' AND column_name='audience') THEN
    ALTER TABLE email_logs ADD CONSTRAINT email_logs_audience_check CHECK (audience IN ('all_students', 'active_students', 'all_companies', 'approved_companies', 'custom'));
  END IF;
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name='email_logs' AND column_name='status') THEN
    ALTER TABLE email_logs ADD CONSTRAINT email_logs_status_check CHECK (status IN ('logged', 'sent', 'failed'));
  END IF;
END IF;

-- ── REFUNDS ──────────────────────────────────────────────────
IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='refunds') THEN
  FOR rec IN SELECT conname FROM pg_constraint WHERE conrelid = 'public.refunds'::regclass AND contype = 'c'
  LOOP
    EXECUTE 'ALTER TABLE refunds DROP CONSTRAINT IF EXISTS ' || quote_ident(rec.conname);
  END LOOP;
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name='refunds' AND column_name='status') THEN
    ALTER TABLE refunds ADD CONSTRAINT refunds_status_check CHECK (status IN ('pending', 'processed', 'failed'));
  END IF;
END IF;

-- ── ASSIGNMENT SUBMISSIONS ───────────────────────────────────
IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='assignment_submissions') THEN
  FOR rec IN SELECT conname FROM pg_constraint WHERE conrelid = 'public.assignment_submissions'::regclass AND contype = 'c'
  LOOP
    EXECUTE 'ALTER TABLE assignment_submissions DROP CONSTRAINT IF EXISTS ' || quote_ident(rec.conname);
  END LOOP;
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name='assignment_submissions' AND column_name='status') THEN
    ALTER TABLE assignment_submissions ADD CONSTRAINT assignment_submissions_status_check CHECK (status IN ('submitted', 'graded', 'late', 'resubmitted'));
  END IF;
END IF;

END
$$;


-- ============================================================
-- PART 2: FIX RLS POLICIES
-- Allow anon + authenticated full access for admin operations
-- ============================================================

DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT unnest(ARRAY[
            'workshop_categories',
            'internship_categories',
            'companies',
            'workshops',
            'internships',
            'certificates',
            'payments',
            'attendance',
            'assignments',
            'notifications',
            'company_partnership_requests',
            'workshop_applications',
            'internship_applications',
            'students',
            'company_users',
            'contact_messages',
            'support_tickets',
            'support_ticket_replies',
            'audit_logs',
            'email_logs',
            'app_settings',
            'refunds',
            'assignment_submissions',
            'team_members',
            'industry_collaborations'
        ])
    LOOP
        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = t) THEN
            -- SELECT
            EXECUTE format('DROP POLICY IF EXISTS "admin_select_%I" ON %I;', t, t);
            EXECUTE format('CREATE POLICY "admin_select_%I" ON %I FOR SELECT TO anon, authenticated USING (true);', t, t);
            -- INSERT
            EXECUTE format('DROP POLICY IF EXISTS "admin_insert_%I" ON %I;', t, t);
            EXECUTE format('CREATE POLICY "admin_insert_%I" ON %I FOR INSERT TO anon, authenticated WITH CHECK (true);', t, t);
            -- UPDATE
            EXECUTE format('DROP POLICY IF EXISTS "admin_update_%I" ON %I;', t, t);
            EXECUTE format('CREATE POLICY "admin_update_%I" ON %I FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);', t, t);
            -- DELETE
            EXECUTE format('DROP POLICY IF EXISTS "admin_delete_%I" ON %I;', t, t);
            EXECUTE format('CREATE POLICY "admin_delete_%I" ON %I FOR DELETE TO anon, authenticated USING (true);', t, t);
        END IF;
    END LOOP;
END
$$;

-- ============================================================
-- DONE! Your admin portal should now work perfectly.
-- ============================================================
