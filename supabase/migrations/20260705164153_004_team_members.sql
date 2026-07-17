/*
# Team Members Table

Allows admins to manage the "Meet Our Team" section shown on the public About page.
Admins can upload a photo, name, and position (role) for each team member.

## New Table: team_members
- id (uuid, primary key)
- name (text, required) — full name displayed on the About page
- role (text, required) — position/title (e.g. "Founder & CEO")
- photo_url (text) — optional profile photo URL (uploaded to the internship-assets bucket)
- display_order (integer) — controls sort order on the About page
- is_visible (boolean) — controls whether the member appears publicly
- created_at (timestamp)
- updated_at (timestamp)

## Security
- Public (anon + authenticated) can SELECT visible team members for the About page
- Only authenticated users (admin via service role operations) can INSERT / UPDATE / DELETE

## Notes
1. Reuses the existing `internship-assets` storage bucket (already has public read + auth upload policies) for photo uploads at path `team-photos/...`.
2. Idempotent: safe to re-run.
*/

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
CREATE POLICY "public_read_team_members" ON team_members FOR SELECT
  TO anon, authenticated USING (is_visible = true);

DROP POLICY IF EXISTS "auth_insert_team_members" ON team_members;
CREATE POLICY "auth_insert_team_members" ON team_members FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_team_members" ON team_members;
CREATE POLICY "auth_update_team_members" ON team_members FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_team_members" ON team_members;
CREATE POLICY "auth_delete_team_members" ON team_members FOR DELETE
  TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_team_members_visible ON team_members(is_visible, display_order);
