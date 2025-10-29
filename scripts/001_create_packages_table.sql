-- Create production_packages table
CREATE TABLE IF NOT EXISTS production_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  popular BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for active packages
CREATE INDEX IF NOT EXISTS idx_packages_active ON production_packages(is_active);

-- Create index for popular packages
CREATE INDEX IF NOT EXISTS idx_packages_popular ON production_packages(popular);

-- Enable Row Level Security
ALTER TABLE production_packages ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access to active packages
CREATE POLICY "Allow public read access to active packages"
  ON production_packages
  FOR SELECT
  USING (is_active = true);

-- Create policy to allow authenticated users to read all packages
CREATE POLICY "Allow authenticated users to read all packages"
  ON production_packages
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policy to allow authenticated users to insert packages
CREATE POLICY "Allow authenticated users to insert packages"
  ON production_packages
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policy to allow authenticated users to update packages
CREATE POLICY "Allow authenticated users to update packages"
  ON production_packages
  FOR UPDATE
  TO authenticated
  USING (true);

-- Create policy to allow authenticated users to delete packages
CREATE POLICY "Allow authenticated users to delete packages"
  ON production_packages
  FOR DELETE
  TO authenticated
  USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_packages_updated_at
  BEFORE UPDATE ON production_packages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
