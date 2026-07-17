-- Add new columns to the students table for extended application details
ALTER TABLE students ADD COLUMN IF NOT EXISTS applicant_status text CHECK (applicant_status IN ('student', 'working'));
ALTER TABLE students ADD COLUMN IF NOT EXISTS branch text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS year_of_study text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS company_name text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS position text;

-- Drop and recreate the submit_application function with new parameters
CREATE OR REPLACE FUNCTION submit_application(
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
AS $$
DECLARE
  v_student_id uuid;
  v_application_id uuid;
  v_status text;
  v_payment_status text;
BEGIN
  -- 1. Upsert student record
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

  -- 2. Insert Application
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
$$;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
