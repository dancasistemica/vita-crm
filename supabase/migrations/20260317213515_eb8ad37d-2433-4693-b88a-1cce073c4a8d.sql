
ALTER TABLE brand_settings
ADD COLUMN IF NOT EXISTS logo_size_desktop INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS logo_size_mobile INTEGER DEFAULT NULL;

UPDATE brand_settings
SET 
  logo_size_desktop = COALESCE(logo_size, 40),
  logo_size_mobile = LEAST(COALESCE(logo_size, 32), 48)
WHERE logo_size IS NOT NULL AND logo_size_desktop IS NULL;
