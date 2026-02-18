-- 발주 이미지 첨부 기능 추가
-- purchase_orders 테이블에 image_url 컬럼 추가

ALTER TABLE purchase_orders
ADD COLUMN IF NOT EXISTS image_url TEXT;

COMMENT ON COLUMN purchase_orders.image_url IS '발주 요청 증빙 이미지 URL (Supabase Storage)';

-- Storage 버킷 생성 (이미 존재하면 무시)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'purchase-images',
  'purchase-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS 정책: 인증된 사용자만 업로드 가능
CREATE POLICY "Users can upload purchase images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'purchase-images');

-- Storage RLS 정책: 모든 사용자가 이미지 조회 가능 (public bucket)
CREATE POLICY "Anyone can view purchase images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'purchase-images');

-- Storage RLS 정책: 업로드한 사용자만 삭제 가능
CREATE POLICY "Users can delete own purchase images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'purchase-images' AND (storage.foldername(name))[1] = auth.uid()::text);
