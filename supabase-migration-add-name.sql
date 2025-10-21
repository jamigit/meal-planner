-- Migration: Add missing 'name' column to weekly_plans table
-- This fixes the data loss issue where weekly plan names are silently ignored

-- Add the name column to weekly_plans table
ALTER TABLE weekly_plans 
ADD COLUMN name TEXT;

-- Add a comment to document the column
COMMENT ON COLUMN weekly_plans.name IS 'Optional custom name for the weekly meal plan';

-- Update existing records to have a default name if they don't have one
-- This ensures existing data has a name value
UPDATE weekly_plans 
SET name = 'Weekly Plan ' || TO_CHAR(created_at, 'YYYY-MM-DD')
WHERE name IS NULL;

-- Optional: Create an index on name for better search performance
CREATE INDEX idx_weekly_plans_name ON weekly_plans(name);

-- Verify the migration worked
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'weekly_plans' 
  AND column_name = 'name';
