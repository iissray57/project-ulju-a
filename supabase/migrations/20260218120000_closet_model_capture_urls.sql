-- closet_models에 입면도/3D 캡처 이미지 URL 컬럼 추가
ALTER TABLE closet_models ADD COLUMN IF NOT EXISTS elevation_image_url TEXT;
ALTER TABLE closet_models ADD COLUMN IF NOT EXISTS three_d_image_url TEXT;

-- 코멘트
COMMENT ON COLUMN closet_models.thumbnail_url IS '평면도 캡처 이미지 URL';
COMMENT ON COLUMN closet_models.elevation_image_url IS '입면도 캡처 이미지 URL';
COMMENT ON COLUMN closet_models.three_d_image_url IS '3D 캡처 이미지 URL';
