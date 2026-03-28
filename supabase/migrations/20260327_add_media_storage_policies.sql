-- Storage policies for Media Library feature
-- Allows authenticated admin users to upload to uploads/ prefix and delete any file in vue-site-assets

-- Allow authenticated uploads to uploads/ prefix
CREATE POLICY "auth_uploads_vue_site_assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'vue-site-assets'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = 'uploads'
  );

-- Allow authenticated users to delete files from vue-site-assets
CREATE POLICY "auth_delete_vue_site_assets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'vue-site-assets'
    AND auth.role() = 'authenticated'
  );
