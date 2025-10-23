-- Add sort_order column to shopping_list_items table
ALTER TABLE shopping_list_items
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Update existing items to have sort_order based on creation order
UPDATE shopping_list_items 
SET sort_order = subquery.row_number - 1
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY shopping_list_id ORDER BY created_at) as row_number
  FROM shopping_list_items
) AS subquery
WHERE shopping_list_items.id = subquery.id;

-- Create index for better performance on sorting
CREATE INDEX IF NOT EXISTS idx_shopping_list_items_sort_order ON shopping_list_items(shopping_list_id, sort_order);

-- Update RLS policy to include new column
CREATE POLICY "Users can only see their own shopping list items" ON shopping_list_items
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);