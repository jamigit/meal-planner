-- Migration: Add meal_role field to shopping_list_items
-- Run this SQL in your Supabase SQL Editor

-- Add meal_role column to shopping_list_items table
ALTER TABLE shopping_list_items 
ADD COLUMN meal_role TEXT DEFAULT 'general';

-- Create index for better performance on meal_role queries
CREATE INDEX idx_shopping_list_items_meal_role ON shopping_list_items(meal_role);

-- Update existing items to have 'general' as default meal_role
UPDATE shopping_list_items 
SET meal_role = 'general' 
WHERE meal_role IS NULL;

-- Add comment to document the field
COMMENT ON COLUMN shopping_list_items.meal_role IS 'Meal role for organizing items by meal type: general, breakfast, lunch, dinner, snacks';
