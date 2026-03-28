-- CMS Content table: stores text/image overrides for inline page editing
-- Public pages fetch overrides on load; admin portal writes via authenticated session

CREATE TABLE cms_content (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  page         text NOT NULL,                  -- 'home','the-oasis','cornerstone','pricing','faq','about','contact','shared'
  cms_key      text NOT NULL,                  -- element key, e.g. 'hero-title'
  content_type text NOT NULL DEFAULT 'text',   -- 'text' | 'html' | 'image'
  value        text NOT NULL,                  -- content string or image URL
  updated_at   timestamptz DEFAULT now(),
  UNIQUE(page, cms_key)
);

-- Indexes
CREATE INDEX idx_cms_content_page ON cms_content (page);

-- Row-level security
ALTER TABLE cms_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read"
  ON cms_content FOR SELECT
  USING (true);

CREATE POLICY "Auth insert"
  ON cms_content FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Auth update"
  ON cms_content FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Auth delete"
  ON cms_content FOR DELETE
  USING (auth.role() = 'authenticated');

-- Storage policy: allow authenticated uploads to vue-site-assets under cms/ prefix
-- (Only needed if not already covered by an existing policy)
INSERT INTO storage.policies (name, bucket_id, definition, check_expression)
SELECT
  'Auth CMS uploads',
  'vue-site-assets',
  '(auth.role() = ''authenticated'')',
  '(storage.foldername(name))[1] = ''cms'''
WHERE NOT EXISTS (
  SELECT 1 FROM storage.policies
  WHERE bucket_id = 'vue-site-assets' AND name = 'Auth CMS uploads'
);
