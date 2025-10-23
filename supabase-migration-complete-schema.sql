-- Complete migration for shopping_list_items table
-- This adds all missing columns and indexes

-- Add sort_order column if it doesn't exist
ALTER TABLE shopping_list_items
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Add meal_role column if it doesn't exist
ALTER TABLE shopping_list_items
ADD COLUMN IF NOT EXISTS meal_role TEXT DEFAULT 'general';

-- Update existing items to have sort_order based on creation order
UPDATE shopping_list_items 
SET sort_order = subquery.row_number - 1
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY shopping_list_id ORDER BY created_at) as row_number
  FROM shopping_list_items
) AS subquery
WHERE shopping_list_items.id = subquery.id;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shopping_list_items_sort_order ON shopping_list_items(shopping_list_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_shopping_list_items_meal_role ON shopping_list_items(meal_role);

-- Update RLS policy to include new columns
DROP POLICY IF EXISTS "Users can only see their own shopping list items" ON shopping_list_items;
CREATE POLICY "Users can only see their own shopping list items" ON shopping_list_items
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
