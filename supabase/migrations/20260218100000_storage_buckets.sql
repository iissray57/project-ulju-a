-- Storage Buckets & RLS Policies
-- images: 일반 이미지 (공개)
-- purchase-images: 발주 증빙 이미지 (공개)
-- site-photos: 주문 현장 사진 (공개)
-- portfolio-images: 포트폴리오 이미지 (공개)
-- reports: PDF 보고서 (비공개)

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('images', 'images', true, 5242880)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('purchase-images', 'purchase-images', true, 5242880)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('site-photos', 'site-photos', true, 5242880)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('portfolio-images', 'portfolio-images', true, 5242880)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('reports', 'reports', false, 10485760)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  -- images bucket
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'images_public_read' AND tablename = 'objects') THEN
    CREATE POLICY "images_public_read" ON storage.objects FOR SELECT TO public
      USING (bucket_id = 'images');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'images_auth_insert' AND tablename = 'objects') THEN
    CREATE POLICY "images_auth_insert" ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'images' AND (storage.foldername(name))[1] = (select auth.uid()::text));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'images_auth_update' AND tablename = 'objects') THEN
    CREATE POLICY "images_auth_update" ON storage.objects FOR UPDATE TO authenticated
      USING (bucket_id = 'images' AND (storage.foldername(name))[1] = (select auth.uid()::text));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'images_auth_delete' AND tablename = 'objects') THEN
    CREATE POLICY "images_auth_delete" ON storage.objects FOR DELETE TO authenticated
      USING (bucket_id = 'images' AND (storage.foldername(name))[1] = (select auth.uid()::text));
  END IF;

  -- purchase-images bucket
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'purchase_images_public_read' AND tablename = 'objects') THEN
    CREATE POLICY "purchase_images_public_read" ON storage.objects FOR SELECT TO public
      USING (bucket_id = 'purchase-images');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'purchase_images_auth_insert' AND tablename = 'objects') THEN
    CREATE POLICY "purchase_images_auth_insert" ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'purchase-images' AND (storage.foldername(name))[1] = (select auth.uid()::text));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'purchase_images_auth_delete' AND tablename = 'objects') THEN
    CREATE POLICY "purchase_images_auth_delete" ON storage.objects FOR DELETE TO authenticated
      USING (bucket_id = 'purchase-images' AND (storage.foldername(name))[1] = (select auth.uid()::text));
  END IF;

  -- site-photos bucket
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'site_photos_public_read' AND tablename = 'objects') THEN
    CREATE POLICY "site_photos_public_read" ON storage.objects FOR SELECT TO public
      USING (bucket_id = 'site-photos');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'site_photos_auth_insert' AND tablename = 'objects') THEN
    CREATE POLICY "site_photos_auth_insert" ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'site-photos');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'site_photos_auth_delete' AND tablename = 'objects') THEN
    CREATE POLICY "site_photos_auth_delete" ON storage.objects FOR DELETE TO authenticated
      USING (bucket_id = 'site-photos');
  END IF;

  -- portfolio-images bucket
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'portfolio_images_public_read' AND tablename = 'objects') THEN
    CREATE POLICY "portfolio_images_public_read" ON storage.objects FOR SELECT TO public
      USING (bucket_id = 'portfolio-images');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'portfolio_images_auth_insert' AND tablename = 'objects') THEN
    CREATE POLICY "portfolio_images_auth_insert" ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'portfolio-images');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'portfolio_images_auth_delete' AND tablename = 'objects') THEN
    CREATE POLICY "portfolio_images_auth_delete" ON storage.objects FOR DELETE TO authenticated
      USING (bucket_id = 'portfolio-images');
  END IF;

  -- reports bucket
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'reports_auth_select' AND tablename = 'objects') THEN
    CREATE POLICY "reports_auth_select" ON storage.objects FOR SELECT TO authenticated
      USING (bucket_id = 'reports' AND (storage.foldername(name))[1] = (select auth.uid()::text));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'reports_auth_insert' AND tablename = 'objects') THEN
    CREATE POLICY "reports_auth_insert" ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'reports' AND (storage.foldername(name))[1] = (select auth.uid()::text));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'reports_auth_delete' AND tablename = 'objects') THEN
    CREATE POLICY "reports_auth_delete" ON storage.objects FOR DELETE TO authenticated
      USING (bucket_id = 'reports' AND (storage.foldername(name))[1] = (select auth.uid()::text));
  END IF;
END $$;
