-- Shopping List Migration for Supabase
-- Run this SQL in your Supabase SQL Editor

-- Create shopping_lists table
CREATE TABLE shopping_lists (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'My Shopping List',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create shopping_list_items table
CREATE TABLE shopping_list_items (
  id SERIAL PRIMARY KEY,
  shopping_list_id INTEGER REFERENCES shopping_lists(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity TEXT,
  unit TEXT,
  category TEXT NOT NULL DEFAULT 'Other',
  checked BOOLEAN DEFAULT FALSE,
  checked_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for shopping_lists
CREATE POLICY "Users can only see their own shopping lists" ON shopping_lists
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only see their own shopping list items" ON shopping_list_items
  FOR ALL USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_shopping_lists_user_id ON shopping_lists(user_id);
CREATE INDEX idx_shopping_list_items_shopping_list_id ON shopping_list_items(shopping_list_id);
CREATE INDEX idx_shopping_list_items_user_id ON shopping_list_items(user_id);
CREATE INDEX idx_shopping_list_items_category ON shopping_list_items(category);
CREATE INDEX idx_shopping_list_items_checked ON shopping_list_items(checked);

-- Enable real-time for shopping_list_items table
ALTER PUBLICATION supabase_realtime ADD TABLE shopping_list_items;

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_shopping_lists_updated_at 
  BEFORE UPDATE ON shopping_lists 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shopping_list_items_updated_at 
  BEFORE UPDATE ON shopping_list_items 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

