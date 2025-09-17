# Meal Planner MVP

A personal meal planning tool built with React + Vite + Tailwind CSS for managing recipes and weekly meal selection.

## Product Requirements Document (PRD)

### Overview
This is a simple tool for managing recipes and selecting 4 meals for weekly planning. Built to solve decision paralysis and reduce weekly meal planning time from 30 minutes to under 10 minutes.

**Primary Goal**: Reduce decision paralysis and time spent on weekly meal planning
**Target Users**: Solo user and partner (personal use)
**Problem**: Currently spending up to 30 minutes weekly deciding on 4 dinner meals, experiencing decision paralysis, and managing recipes across multiple Google Drive documents.

### Core Features
- **Recipe Management**: Store recipes with name, URL, and tags
- **Weekly Meal Selection**: Choose 4 recipes for the week with notes
- **Saved Plans**: View and manage all previous weekly plans
- **Data Persistence**: Everything stored locally/database with proper error handling

### Success Criteria
- ✅ Reduce weekly meal planning time to under 10 minutes
- ✅ Centralize recipe management in one location
- ✅ Enable quick weekly meal selection and planning
- 🔄 Provide foundation for future enhancements (AI suggestions, shopping lists)

### User Stories

#### Core User Stories (MVP)
- **As a user**, I want to add my existing recipes with name, URL, and tags so I can centralize my recipe collection
- **As a user**, I want to filter recipes by tags so I can quickly find relevant options
- **As a user**, I want to select 4 recipes for the week so I can plan my dinners
- **As a user**, I want to save weekly plans so I can track what I've planned
- **As a user**, I want to view my weekly plan so I can reference it throughout the week

#### Future User Stories (Post-MVP)
- **As a user**, I want AI-suggested recipes so I can discover new meal ideas
- **As a user**, I want to generate shopping lists so I can streamline grocery shopping
- **As a user**, I want to sync across devices so my partner and I can both access the planner

### Data Models

#### Recipe
```javascript
{
  id: string,           // Unique identifier
  name: string,         // Recipe name
  url: string,          // Optional recipe URL
  tags: string[],       // Array of tags for filtering
  createdAt: string,    // ISO timestamp
  updatedAt: string     // ISO timestamp
}
```

#### WeeklyPlan
```javascript
{
  id: string,           // Unique identifier
  meals: Recipe[],      // Array of selected recipes (max 4)
  notes: string,        // Optional notes about preferences
  isCurrent: boolean,   // Whether this is the active plan
  createdAt: string     // ISO timestamp
}
```

### Tech Stack
- **Frontend**: React + Vite + Tailwind CSS
- **Data Storage**: localStorage → Database (SQLite planned)
- **Styling**: Custom Tailwind component classes
- **Routing**: React Router DOM
- **Deployment**: Vercel (planned)
- **Authentication**: None (MVP), Supabase auth later

### UI Design System
Custom Tailwind component classes:
```css
.card          → Clean card layout with shadow
.btn-primary   → Blue action buttons
.btn-secondary → Gray secondary buttons
.tag           → Blue pill-shaped tags
```

### Navigation Structure
- **Recipes** (`/`) - Manage recipe collection
- **Weekly Planner** (`/planner`) - Create and edit current meal plan
- **Saved Plans** (`/saved-plans`) - View and manage all saved plans

### Key Requirements
- **Simple UI**: Focus on functionality over complex styling
- **Component Structure**: Clean, reusable components
- **Tag System**: Easy filtering and display of recipe tags
- **Weekly Planning**: Select exactly 4 recipes with notes capability
- **Data Persistence**: Robust error handling for storage operations

## Current Development Status

### ✅ Completed
- [x] **Project Setup** - React + Vite + Tailwind CSS configured
- [x] **Basic App Structure** - Navigation and routing
- [x] **localStorage Utilities** - CRUD operations with error handling
- [x] **Recipe Display** - Card-based layout with tags
- [x] **Weekly Planning** - Recipe selection modal with 4-meal limit
- [x] **Saved Plans** - View/manage all saved weekly plans
- [x] **Sample Data** - 4 sample recipes for testing

### 🔄 In Progress
- [ ] **Database Integration** - Transition from localStorage to database
- [ ] **CSV Import** - Manual recipe upload functionality

### 📋 Planned Features
- [ ] **Add/Edit Recipes** - Form-based recipe management
- [ ] **Enhanced Search** - Advanced filtering and sorting
- [ ] **Recipe Import** - Import from URLs
- [ ] **Export Options** - Export meal plans
- [ ] **Mobile Optimization** - Responsive design improvements

## Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Getting Started
```bash
# Clone the repository
git clone [repository-url]
cd meal-planner

# Install dependencies
npm install

# Start development server
npm run dev

# Open browser to http://localhost:5173
```

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Project Structure
```
meal-planner/
├── src/
│   ├── components/       # React components
│   │   ├── Navigation.jsx
│   │   ├── RecipeList.jsx
│   │   ├── RecipeSelector.jsx
│   │   ├── WeeklyPlanner.jsx
│   │   └── SavedPlans.jsx
│   ├── utils/           # Utility functions
│   │   └── localStorage.js
│   ├── App.jsx          # Main app component
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles + Tailwind
├── public/              # Static assets
├── README.md            # This file
└── package.json         # Dependencies
```

## Usage

### Managing Recipes
1. Navigate to **Recipes** page
2. View all recipes in card format with tags
3. Filter by tags or search by name
4. Each recipe shows name, URL link, and associated tags

### Creating Weekly Plans
1. Go to **Weekly Planner** page
2. Click **"Select Meals"** to open recipe selector
3. Choose up to 4 recipes (visual selection with checkmarks)
4. Add optional notes about meal preferences
5. Click **"Save Plan"** to store the weekly plan

### Managing Saved Plans
1. Visit **Saved Plans** page
2. View all previously saved plans with creation dates
3. See which plan is currently active
4. Set any saved plan as current or delete unwanted plans

## Development Philosophy

This project follows a **"working MVP first"** approach:
- Functionality over perfect code
- Clean, simple UI over complex styling
- Incremental improvements over big rewrites
- localStorage first, database later
- Manual processes before automation

The goal is to get a working meal planner quickly, then enhance it iteratively based on actual usage patterns.

## Future Enhancements

### Phase 2: AI Integration
- Claude API integration for recipe suggestions
- Smart meal planning based on preferences and history

### Phase 3: Enhanced Recipe Data
- Full recipe details (ingredients, instructions, prep time)
- Shopping list generation
- Recipe photos and nutritional information
- Recipe scaling and serving calculations

### Phase 4: Multi-User Support
- Supabase authentication
- Real-time sync between devices
- Shared planning between partners

### UI/UX Improvements
- Drag-and-drop meal planning interface
- Mobile optimization (currently desktop-first)
- Dark mode theme
- Keyboard shortcuts and accessibility

### Performance Requirements
- App should load in under 2 seconds
- Intuitive interface requiring no learning curve
- Clean code structure for easy enhancement

## Constraints & Limitations

### Current MVP Constraints
- localStorage only (no server backend)
- Single user only (no multi-user support initially)
- Basic styling (focus on functionality over visual polish)
- Desktop-first (mobile optimization in future versions)

### Technical Constraints
- React + Vite stack (established)
- Tailwind CSS for styling (established)
- Browser localStorage limits (~5-10MB)

## Contributing

This is a personal project, but suggestions and improvements are welcome:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is for personal use. Feel free to use it as a starting point for your own meal planning tool.

---

**Built with ❤️ for better meal planning**