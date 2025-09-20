# Supabase Setup Guide

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up/Login and create a new project
3. Choose a region close to you
4. Set a strong database password
5. Wait for project to be ready (2-3 minutes)

## 2. Get Project Credentials

1. Go to Project Settings → API
2. Copy the following values:
   - **Project URL** (starts with https://)
   - **Anon/Public Key** (starts with eyJ)

## 3. Set Up Environment Variables

Create a `.env` file in your project root with:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Claude API Configuration (for AI suggestions)
VITE_CLAUDE_API_KEY=your_claude_api_key
CLAUDE_API_KEY=your_claude_api_key
```

## 4. Create Database Tables

Run this SQL in your Supabase SQL Editor:

```sql
-- Enable Row Level Security
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_history ENABLE ROW LEVEL SECURITY;

-- Create recipes table
CREATE TABLE recipes (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  url TEXT,
  ingredients TEXT[],
  instructions TEXT[],
  prep_time INTEGER,
  cook_time INTEGER,
  servings INTEGER,
  cuisine_tags TEXT[],
  ingredient_tags TEXT[],
  convenience_tags TEXT[],
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create weekly_plans table
CREATE TABLE weekly_plans (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  meals JSONB NOT NULL,
  notes TEXT,
  is_current BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create meal_history table
CREATE TABLE meal_history (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
  week_date DATE NOT NULL,
  eaten_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Row Level Security policies
CREATE POLICY "Users can only see their own recipes" ON recipes
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only see their own weekly plans" ON weekly_plans
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only see their own meal history" ON meal_history
  FOR ALL USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_recipes_user_id ON recipes(user_id);
CREATE INDEX idx_weekly_plans_user_id ON weekly_plans(user_id);
CREATE INDEX idx_meal_history_user_id ON meal_history(user_id);
CREATE INDEX idx_meal_history_recipe_id ON meal_history(recipe_id);
CREATE INDEX idx_meal_history_eaten_date ON meal_history(eaten_date);
```

## 5. Set Up Authentication

1. Go to Authentication → Settings
2. Disable "Enable email confirmations" (for single user)
3. Go to Authentication → Users
4. Click "Add user" and create your admin account:
   - Email: your-email@example.com
   - Password: your-secure-password

## 6. Test the Setup

1. Start your development server: `npm run dev`
2. You should see the login screen
3. Use the credentials you created in step 5
4. The app should load with your data synced to Supabase

## 7. Deploy to Production

1. Deploy frontend to Vercel/Netlify
2. Add the same environment variables to your hosting platform
3. Your app will work across all devices with real-time sync!

## Troubleshooting

- **Login not working**: Check your email/password in Supabase Users
- **Data not syncing**: Check your environment variables
- **Database errors**: Make sure you ran the SQL setup script
- **CORS errors**: Check your Supabase project URL is correct
