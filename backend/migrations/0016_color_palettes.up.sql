ALTER TABLE covers ADD COLUMN palette_colors text;
ALTER TABLE covers ADD COLUMN color_harmony_score double precision DEFAULT 0;
ALTER TABLE covers ADD COLUMN color_harmony_explanation text;
