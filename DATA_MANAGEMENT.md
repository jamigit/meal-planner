# 📊 Data Management Guide

This guide explains how to manage your recipe data in the meal planner app for consistent development sessions.

## 🏗️ **Storage Architecture**

Your meal planner uses **IndexedDB** (via Dexie) for client-side storage:
- **Persistent**: Data automatically persists between browser sessions
- **Local**: Stored in your browser, specific to each browser profile
- **Fast**: No network requests needed for data access

## 📁 **Database Structure**

**Database**: `MealPlannerDB`
**Tables**:
- `recipes` - Recipe data with ingredients, instructions, categorized tags
- `weeklyPlans` - Saved meal plans with scaling factors
- `mealHistory` - Tracking of actually consumed meals
- `shoppingLists` - Generated shopping lists for weekly plans

## 🌱 **Sample Data System**

### **Source Files**
- `src/data/sampleRecipes.js` - Comprehensive recipe database with:
  - Full ingredients lists
  - Step-by-step instructions
  - Categorized tags (Cuisine, Ingredients, Convenience)
  - Prep/cook times and servings
  - Recipe URLs

### **Seeding Functions** (`src/utils/seedDatabase.js`)
- `seedDatabase()` - Adds sample data if database is empty
- `clearAllRecipes()` - Removes all recipes
- `reseedDatabase()` - Clears existing data and reseeds with samples

## 🔧 **Developer Tools**

### **In-App Developer Utils**
Look for the purple "🔧 Dev" button in the bottom-right corner (development only):

**Actions Available**:
- **🌱 Seed Sample Data** - Add sample recipes if database is empty
- **🔄 Clear & Reseed** - Replace all data with fresh samples
- **🗑️ Clear All Recipes** - Remove all recipes
- **🏷️ Migrate to Categorized Tags** - Convert legacy tags to new system
- **📊 Count Recipes** - Show current database size
- **💾 Export Recipe Data** - Download recipes as JSON file

### **Browser DevTools Inspection**

**Chrome/Edge**:
1. F12 → **Application** tab
2. **Storage** → **IndexedDB** → **MealPlannerDB**
3. Click on any table to browse data

**Firefox**:
1. F12 → **Storage** tab
2. **Indexed DB** → **MealPlannerDB**

## 📝 **Adding Your Own Recipes**

### **Option 1: Edit Sample Data File**
Add to `src/data/sampleRecipes.js`:

```javascript
{
  name: "Your Recipe Name",
  url: "https://example.com/recipe",
  tags: ["dietary-restrictions", "meal-type"], // Legacy tags
  cuisine_tags: ["Italian"], // Pick from predefined list
  ingredient_tags: ["Chicken", "Pasta"], // Main ingredients
  convenience_tags: ["Quick", "One-Pot"], // Convenience factors
  prep_time: 15, // minutes
  cook_time: 30, // minutes
  servings: 4,
  ingredients: [
    "1 lb chicken breast",
    "2 cups pasta",
    // ... more ingredients
  ],
  instructions: [
    "Step 1: Do this",
    "Step 2: Do that",
    // ... more steps
  ]
}
```

### **Option 2: Use CSV Upload**
In the app, go to **Recipes** page and use the CSV upload feature.

### **Option 3: Add Through UI**
Use the "Add Recipe" button to manually enter recipes with the new categorized tag system.

## 🏷️ **Tag Categories**

The new categorized system organizes tags into:

**🌍 Cuisine** (Blue): Italian, Mexican, Japanese, Thai, etc.
**🥘 Ingredients** (Green): Chicken, Pasta, Fish, Vegetables, etc.
**⚡ Convenience** (Purple): Quick, One-Pot, Make-Ahead, Advanced, etc.
**🏷️ Other** (Gray): Dietary restrictions, special occasions

## 🔄 **Development Workflow**

### **Starting Fresh**
1. Open app in browser
2. Click "🔧 Dev" button
3. Click "🔄 Clear & Reseed"
4. Refresh page to see 8 detailed sample recipes

### **Adding Custom Data**
1. Edit `src/data/sampleRecipes.js`
2. Click "🔄 Clear & Reseed" to reload with your changes
3. Or use "🌱 Seed Sample Data" to add without clearing

### **Migrating Existing Data**
If you have recipes with old tag system:
1. Click "🏷️ Migrate to Categorized Tags"
2. System automatically categorizes existing tags
3. Preview migration before confirming

### **Exporting Your Data**
1. Click "💾 Export Recipe Data"
2. Downloads `meal-planner-recipes-YYYY-MM-DD.json`
3. Use as backup or to share with other developers

## 💡 **Tips**

- **Persistence**: Data survives page refreshes and browser restarts
- **Browser Specific**: Each browser profile has separate data
- **Development vs Production**: DevUtils only appears in development mode
- **Backup**: Export your data regularly if you've added custom recipes
- **Testing**: Use clear/reseed to test with clean data sets

## 🚨 **Troubleshooting**

**No recipes showing?**
- Check browser console for errors
- Try "🔧 Dev" → "📊 Count Recipes"
- Use "🌱 Seed Sample Data" to add data

**Tags not displaying correctly?**
- Use "🏷️ Migrate to Categorized Tags"
- Check if recipes have the new tag format

**Database issues?**
- Clear browser data for localhost:5173
- Use "🔄 Clear & Reseed" to start fresh