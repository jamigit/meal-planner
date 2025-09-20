import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
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
  const location = useLocation()

  // Page transition variants
  const pageVariants = {
    initial: { opacity: 0, x: -20 },
    in: { opacity: 1, x: 0 },
    out: { opacity: 0, x: 20 }
  }

  const pageTransition = {
    type: "tween",
    ease: "easeInOut",
    duration: 0.3
  }

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
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={
              <motion.div
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
              >
                <WeeklyPlanner />
              </motion.div>
            } />
            <Route path="/recipes" element={
              <motion.div
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
              >
                <RecipeList />
              </motion.div>
            } />
            <Route path="/saved-plans" element={
              <motion.div
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
              >
                <SavedPlans />
              </motion.div>
            } />
            <Route path="/meal-history" element={
              <motion.div
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
              >
                <MealHistory />
              </motion.div>
            } />
          </Routes>
        </AnimatePresence>
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
