/*
# Industry Collaborations Table

Allows admins to manage the list of industry partner companies shown on the public website's homepage.

## New Table: industry_collaborations
- id (uuid, primary key)
- name (text, required) — company name displayed on the homepage
- logo_url (text) — optional company logo image URL
- website_url (text) — optional link to company website
- display_order (integer) — controls sort order on the homepage
- is_visible (boolean) — controls whether the company appears publicly
- created_at (timestamp)

## Security
- Public (anon + authenticated) can SELECT visible collaborations for the homepage
- Only authenticated users (admin via service role operations) can INSERT / UPDATE / DELETE
*/

CREATE TABLE IF NOT EXISTS industry_collaborations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  website_url text,
  display_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE industry_collaborations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_collaborations" ON industry_collaborations;
CREATE POLICY "public_read_collaborations" ON industry_collaborations FOR SELECT
TO anon, authenticated USING (is_visible = true);

DROP POLICY IF EXISTS "auth_insert_collaborations" ON industry_collaborations;
CREATE POLICY "auth_insert_collaborations" ON industry_collaborations FOR INSERT
TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_collaborations" ON industry_collaborations;
CREATE POLICY "auth_update_collaborations" ON industry_collaborations FOR UPDATE
TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_collaborations" ON industry_collaborations;
CREATE POLICY "auth_delete_collaborations" ON industry_collaborations FOR DELETE
TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_collaborations_visible ON industry_collaborations(is_visible, display_order);
