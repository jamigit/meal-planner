import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx'
import { isSupabaseConfigured } from './lib/supabase.js'
import Navigation from './components/Navigation'
import RecipeList from './components/RecipeList'
import WeeklyPlanner from './components/WeeklyPlanner'
import SavedPlans from './components/SavedPlans'
import MealHistory from './components/MealHistory'
import Login from './components/Login'
import RecipeSeeder from './components/RecipeSeeder'

function AppContent() {
  const { isAuthenticated, loading } = useAuth()
  const supabaseConfigured = isSupabaseConfigured()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Only show login if Supabase is configured and user is not authenticated
  if (supabaseConfigured && !isAuthenticated) {
    return <Login />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-8 pb-20 md:pb-8">
        <Routes>
          <Route path="/" element={<WeeklyPlanner />} />
          <Route path="/recipes" element={<RecipeList />} />
          <Route path="/saved-plans" element={<SavedPlans />} />
          <Route path="/meal-history" element={<MealHistory />} />
        </Routes>
      </main>

      {/* Developer Utils - only in development */}
          <RecipeSeeder />
        </div>
      )
    }

    function App() {
      return (
        <AuthProvider>
          <Router>
            <AppContent />
          </Router>
        </AuthProvider>
      )
    }

export default App
