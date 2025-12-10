-- VisionDiffusion Database Schema (PostgreSQL/Supabase)

CREATE TABLE IF NOT EXISTS analyses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    image_url TEXT NOT NULL,
    analysis_type TEXT NOT NULL CHECK (analysis_type IN ('caption', 'vqa', 'ocr')),
    result TEXT NOT NULL,
    prompt TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS generations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    generation_type TEXT NOT NULL CHECK (generation_type IN ('text-to-image', 'variation')),
    prompt TEXT NOT NULL,
    result_url TEXT NOT NULL,
    source_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generations_created_at ON generations(created_at DESC);

ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on analyses" ON analyses FOR ALL USING (true);
CREATE POLICY "Allow all on generations" ON generations FOR ALL USING (true);
