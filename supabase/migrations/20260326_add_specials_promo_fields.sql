-- Add promo image and PDF flyer support to specials
ALTER TABLE specials ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE specials ADD COLUMN IF NOT EXISTS image_alt text;
ALTER TABLE specials ADD COLUMN IF NOT EXISTS pdf_url text;

COMMENT ON COLUMN specials.image_url IS 'URL to a promo/marketing image displayed on the public site';
COMMENT ON COLUMN specials.image_alt IS 'Alt text for the promo image';
COMMENT ON COLUMN specials.pdf_url IS 'URL to a downloadable PDF flyer';
