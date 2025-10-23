# Architecture Overview

## System Components

### Frontend (React + Vite)
- **React 18** with hooks and concurrent features
- **Vite** for fast development and optimized builds
- **Tailwind CSS** with custom design system
- **Framer Motion** for smooth animations
- **React Router** for client-side navigation

### Backend & Data Layer
- **Supabase** (PostgreSQL) for authenticated users with real-time subscriptions
- **IndexedDB** (via Dexie) for offline-first functionality
- **Service Selector** automatically chooses storage based on authentication status

### AI & External Services
- **Node.js Express Server** (`server.js`) running on port 3002
- **Claude API** proxy for meal suggestions and recipe analysis
- **EmailJS** for client-side email functionality
- **Recipe Scraper** for extracting data from URLs

## Data Flow Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React App     │    │  Service Layer   │    │   Data Storage  │
│                 │    │                  │    │                 │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │ ┌─────────────┐  │
│ │ Components  │ │◄──►│ │ Service      │ │◄──►│ │ Supabase    │  │
│ │ (UI Layer)  │ │    │ │ Selector     │ │    │ │ (Cloud)     │  │
│ └─────────────┘ │    │ └──────────────┘ │    │ └─────────────┘  │
│                 │    │                  │    │                 │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │ ┌─────────────┐  │
│ │ Custom      │ │◄──►│ │ Supabase     │ │◄──►│ │ IndexedDB   │  │
│ │ Hooks       │ │    │ │ Services     │ │    │ │ (Local)     │  │
│ └─────────────┘ │    │ └──────────────┘ │    │ └─────────────┘  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Service Layer Pattern

### Dual Storage Strategy
- **Authenticated Users**: Supabase with real-time subscriptions
- **Guest Users**: IndexedDB for local-only experience
- **Service Selector**: Automatically routes to appropriate service
- **Data Consistency**: Same API interface for both storage types

### Technical Debt Management
- **Debt Tracking**: Comprehensive system for identifying and managing technical debt
- **AI Annotations**: `@ai-technical-debt(priority, effort, impact)` format for documenting shortcuts
- **Automated Reporting**: CLI tools for generating debt reports and statistics
- **Priority System**: Critical, High, Medium, Low priority levels with effort and impact scoring

### Service Interface
```javascript
// All services follow this pattern
class ServiceName {
  async getAll()           // Get all records
  async getById(id)       // Get single record
  async add(data)         // Create new record
  async update(id, data)  // Update existing record
  async delete(id)        // Delete record
}
```

## Request Flow Examples

### AI Meal Planner Request
1. User clicks "Suggest Meals" in MealPlannerV2
2. Component calls `aiMealPlannerService.generateEightMealSuggestions()`
3. Service detects environment (dev vs prod)
4. Makes request to `http://localhost:3002/api/claude` (dev) or Netlify Functions (prod)
5. Node server proxies to Claude API with structured prompt
6. Response parsed and returned to component
7. Component updates state with suggestions

### Data CRUD Request
1. User adds recipe in RecipeForm
2. Component calls `serviceSelector.getRecipeService()`
3. Service selector checks authentication status
4. Routes to `supabaseRecipeService.add()` or `recipeService.add()`
5. Service validates and normalizes data
6. Writes to appropriate storage (Supabase or IndexedDB)
7. Returns normalized data to component
8. Component updates UI with new recipe

## Real-time Architecture

### Supabase Subscriptions
- **Shopping List Items**: Real-time updates for collaborative shopping
- **Authentication State**: Global auth state changes
- **Connection Management**: Automatic reconnection and error recovery

### IndexedDB Fallback
- **Local-only Experience**: No real-time sync for guest users
- **Offline Capability**: Full CRUD operations without internet
- **Data Persistence**: Survives browser restarts

## Security Architecture

### Content Security Policy
- **XSS Protection**: Strict CSP with allowed origins
- **Resource Restrictions**: Only trusted domains allowed
- **Local Development**: Explicit localhost allowances for HTTPS PWA testing

### Authentication Flow
- **Supabase Auth**: Password-based authentication
- **Row Level Security**: Database-level access control
- **Service Layer**: Automatic auth state detection

## Performance Considerations

### Caching Strategy
- **AI Responses**: 15-minute cache with rate limiting
- **Service Worker**: Aggressive caching for static assets
- **Real-time**: Efficient subscription management with cleanup

### Bundle Optimization
- **Code Splitting**: Route-based lazy loading
- **Tree Shaking**: Unused code elimination
- **Asset Optimization**: Image compression and format selection

## Development vs Production

### Development Environment
- **Local Server**: Node.js server on port 3002
- **Hot Reload**: Vite dev server with HMR
- **Debug Tools**: Console logging and error boundaries

### Production Environment
- **Static Build**: Optimized bundle served via CDN
- **Netlify Functions**: Serverless AI proxy
- **HTTPS Required**: PWA installation requirements