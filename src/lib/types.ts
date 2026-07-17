export interface Workshop {
  id: string;
  thumbnail_url: string | null;
  banner_url: string | null;
  name: string;
  slug: string;
  category_id: string | null;
  workshop_type: 'online' | 'offline' | 'hybrid';
  status: 'draft' | 'active' | 'closed' | 'archived';
  application_start_date: string | null;
  application_end_date: string | null;
  commencement_date: string | null;
  end_date: string | null;
  registration_deadline: string | null;
  instructor_name: string | null;
  instructor_image_url: string | null;
  duration: string | null;
  price_type: 'free' | 'paid';
  price: number | null;
  currency: string;
  seats_available: number | null;
  description: string | null;
  learning_outcomes: string[] | null;
  curriculum: Record<string, unknown> | null;
  requirements: string[] | null;
  resources: Record<string, unknown> | null;
  certificate_available: boolean;
  meeting_link: string | null;
  recording_link: string | null;
  tags: string[] | null;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
  workshop_categories?: WorkshopCategory;
}

export interface Internship {
  id: string;
  thumbnail_url: string | null;
  company_logo_url: string | null;
  banner_url: string | null;
  name: string;
  slug: string;
  category_id: string | null;
  domain: string | null;
  company_id: string | null;
  partner_company_name: string | null;
  description: string | null;
  roles: string[] | null;
  responsibilities: string[] | null;
  skills_required: string[] | null;
  eligibility: string | null;
  duration: string | null;
  work_mode: 'remote' | 'hybrid' | 'on-site';
  location: string | null;
  number_of_openings: number | null;
  application_start_date: string | null;
  application_end_date: string | null;
  internship_start_date: string | null;
  internship_end_date: string | null;
  stipend_type: 'paid' | 'unpaid';
  stipend_amount: number | null;
  stipend_currency: string;
  certificate_provided: boolean;
  lor_provided: boolean;
  projects_included: boolean;
  mentor: string | null;
  assessment_criteria: string | null;
  status: 'draft' | 'open' | 'closed' | 'archived';
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
  internship_categories?: InternshipCategory;
  companies?: Company;
}

export interface WorkshopCategory {
  id: string;
  name: string;
  slug: string;
  color: string;
}

export interface InternshipCategory {
  id: string;
  name: string;
  slug: string;
  color: string;
}

export interface Company {
  id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
  banner_url: string | null;
  website: string | null;
  industry: string | null;
  description: string | null;
  hr_contact_name: string | null;
  hr_contact_email: string | null;
  hr_contact_phone: string | null;
  linkedin_url: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  college: string | null;
  degree: string | null;
  graduation_year: number | null;
  skills: string[] | null;
  resume_url: string | null;
  status: 'active' | 'suspended' | 'deleted';
  created_at: string;
  updated_at: string;
}

export interface Certificate {
  id: string;
  certificate_number: string;
  student_id: string | null;
  student_name: string;
  program_name: string;
  program_type: 'workshop' | 'internship';
  workshop_id: string | null;
  internship_id: string | null;
  issue_date: string;
  expiry_date: string | null;
  status: 'active' | 'revoked' | 'expired';
  qr_code_url: string | null;
  pdf_url: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  student_id: string | null;
  workshop_application_id: string | null;
  amount: number;
  currency: string;
  status: 'pending' | 'successful' | 'failed' | 'refunded';
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  receipt_url: string | null;
  created_at: string;
}

export interface WorkshopApplication {
  id: string;
  workshop_id: string;
  student_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'payment_pending' | 'paid';
  payment_status: 'not_required' | 'pending' | 'successful' | 'failed' | 'refunded';
  applied_at: string;
  updated_at: string;
  workshops?: Workshop;
  students?: Student;
}

export interface InternshipApplication {
  id: string;
  internship_id: string;
  student_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'interview_scheduled';
  cover_letter: string | null;
  applied_at: string;
  updated_at: string;
  internships?: Internship;
  students?: Student;
}

export interface CompanyPartnershipRequest {
  id: string;
  company_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  website: string | null;
  industry: string | null;
  message: string | null;
  request_type: 'partnership' | 'hire_interns' | 'collaboration';
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
  created_at: string;
}

export type UserRole = 'student' | 'company' | 'admin' | null;
