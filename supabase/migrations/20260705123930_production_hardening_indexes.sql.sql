/*
# Production Hardening - Performance Indexes & Idempotency

## Overview
This migration adds critical indexes for query performance and idempotency support 
for payment webhooks to prevent duplicate processing.

## Indexes Added
1. `idx_payments_order_id` - For webhook lookups by razorpay_order_id
2. `idx_payments_status` - For filtering payments by status
3. `idx_workshop_applications_status` - For filtering applications by status
4. `idx_internship_applications_status` - For filtering applications by status
5. `idx_students_email` - For login/email lookups
6. `idx_workshops_created_at` - For ordered listing with pagination
7. `idx_internships_created_at` - For ordered listing with pagination
8. `idx_certificates_student_id` - For student certificate lookups

## Idempotency
Adds `idempotency_key` column to payments table to prevent duplicate webhook processing.

## Security
Adds `processed_at` timestamp to track webhook processing completion.
*/

-- Performance indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workshop_applications_status ON workshop_applications(status);
CREATE INDEX IF NOT EXISTS idx_workshop_applications_created ON workshop_applications(applied_at DESC);
CREATE INDEX IF NOT EXISTS idx_internship_applications_status ON internship_applications(status);
CREATE INDEX IF NOT EXISTS idx_internship_applications_created ON internship_applications(applied_at DESC);
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_created ON students(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workshops_created_at ON workshops(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_internships_created_at ON internships(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_certificates_student ON certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_certificates_created ON certificates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created ON contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created ON support_tickets(created_at DESC);

-- Add idempotency key to payments for webhook deduplication
ALTER TABLE payments ADD COLUMN IF NOT EXISTS idempotency_key text UNIQUE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS webhook_processed_at timestamptz;

-- Add unique constraint to prevent duplicate payment processing
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_idempotency ON payments(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- Add processed flag for webhooks
ALTER TABLE payments ADD COLUMN IF NOT EXISTS webhook_processed boolean DEFAULT false;

-- Add indexes for company users
CREATE INDEX IF NOT EXISTS idx_company_users_email ON company_users(email);

-- Add index for notifications by read status and user
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, read) WHERE read = false;
