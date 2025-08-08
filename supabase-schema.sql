-- Templates table
CREATE TABLE templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  page_size JSONB NOT NULL,
  background_color TEXT NOT NULL DEFAULT '#ffffff',
  background_image_url TEXT,
  bleed INTEGER NOT NULL DEFAULT 0,
  name_color TEXT NOT NULL DEFAULT '#111827',
  name_font_size INTEGER NOT NULL DEFAULT 24,
  show_event_name BOOLEAN NOT NULL DEFAULT true,
  qr_code_settings JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert the existing template
INSERT INTO templates (
  id,
  name,
  description,
  page_size,
  background_color,
  background_image_url,
  bleed,
  name_color,
  name_font_size,
  show_event_name,
  qr_code_settings
) VALUES (
  'template_1754509562824',
  'Investor Summit 2025',
  'Badge template with custom background',
  '{"id": "t180_badge", "name": "T180 Badge (96mm x 134mm)", "width": 96, "height": 134, "cssWidth": "96mm", "cssHeight": "134mm"}',
  '#ffffff',
  'https://r6m0dwyqoaamm8ul.public.blob.vercel-storage.com/templates/images/template_1754509562824.png',
  0,
  '#ffffff',
  32,
  false,
  '{"showOnFront": false, "showOnBack": true, "position": {"x": 82, "y": 82}, "size": 24}'
);

-- Create storage bucket for template images
INSERT INTO storage.buckets (id, name, public) VALUES ('template-images', 'template-images', true);

-- Allow public access to template images
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'template-images');

-- Allow authenticated uploads to template images  
CREATE POLICY "Allow uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'template-images');