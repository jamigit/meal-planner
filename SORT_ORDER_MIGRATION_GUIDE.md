# Supabase Migration: Add sort_order Column

## Problem
The drag-and-drop reordering feature is failing because the `sort_order` column doesn't exist in the `shopping_list_items` table.

## Solution
Run the migration script to add the missing column.

## Steps to Fix

### 1. Run the Migration
Execute the SQL migration in your Supabase dashboard:

```sql
-- Add sort_order column with default value
ALTER TABLE shopping_list_items 
ADD COLUMN sort_order INTEGER DEFAULT 0;

-- Create index for better performance on sorting queries
CREATE INDEX idx_shopping_list_items_sort_order 
ON shopping_list_items(shopping_list_id, sort_order);

-- Update existing items to have sequential sort_order values
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
```

### 2. Alternative: Use Supabase CLI
If you have the Supabase CLI installed:

```bash
# Create a new migration
supabase migration new add_sort_order_to_shopping_list_items

# Copy the SQL content from supabase-migration-add-sort-order.sql
# Then apply the migration
supabase db push
```

### 3. Verify the Fix
After running the migration:
1. Refresh your shopping list page
2. Try dragging and dropping items to reorder them
3. The reordering should now work without errors

## What This Fixes
- ✅ Drag-and-drop reordering functionality
- ✅ Proper item ordering within categories
- ✅ Performance optimization with database index
- ✅ Backward compatibility with existing items

## Files Updated
- `src/database/db.js` - Added IndexedDB schema version 10
- `src/database/supabaseShoppingListService.js` - Updated queries to use sort_order
- `src/database/shoppingListService.js` - Updated IndexedDB queries
- `supabase-migration-add-sort-order.sql` - Database migration script
