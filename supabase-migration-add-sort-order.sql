-- Migration: Add sort_order column to shopping_list_items table
-- This enables drag-and-drop reordering functionality

-- Add sort_order column with default value
ALTER TABLE shopping_list_items 
ADD COLUMN sort_order INTEGER DEFAULT 0;

-- Create index for better performance on sorting queries
CREATE INDEX idx_shopping_list_items_sort_order 
ON shopping_list_items(shopping_list_id, sort_order);

-- Update existing items to have sequential sort_order values
-- This ensures existing items have proper ordering
WITH ranked_items AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY shopping_list_id ORDER BY created_at) - 1 as new_sort_order
  FROM shopping_list_items
)
UPDATE shopping_list_items 
SET sort_order = ranked_items.new_sort_order
FROM ranked_items 
WHERE shopping_list_items.id = ranked_items.id;

-- Add comment to document the column purpose
COMMENT ON COLUMN shopping_list_items.sort_order IS 'Order of items within a shopping list for drag-and-drop functionality';
