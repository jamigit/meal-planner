import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx'
import { isSupabaseConfigured } from './lib/supabase.js'
import { ErrorBoundary, withErrorBoundary } from './components/ErrorBoundary.jsx'
import { LoadingProvider } from './components/LoadingComponents.jsx'
import { GlobalLoadingIndicator } from './components/LoadingIndicators.jsx'
import { SecurityHeaders } from './components/SecurityComponents.jsx'
import { OptimisticUpdateProvider } from './components/OptimisticComponents.jsx'
import { NetworkResilienceProvider } from './components/NetworkComponents.jsx'
import { AccessibilityProvider } from './components/AccessibilityComponents.jsx'
import Navigation from './components/Navigation'
import RecipeList from './components/RecipeList'
import WeeklyPlanner from './components/WeeklyPlanner'
import MealPlannerV2 from './components/MealPlannerV2'
import SavedPlans from './components/SavedPlans'
import MealHistory from './components/MealHistory'
import Login from './components/Login'
import Styleguide from './components/Styleguide'
import DesignSystemTest from './components/DesignSystemTest'

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
      <div className="min-h-screen flex items-center justify-center">
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
    <div className="min-h-screen">
      <Navigation />
      <main id="main-content" className="container mx-auto max-w-[1000px] px-4 py-8 pb-20 md:pb-8">
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
            <Route path="/meal-planner-v2" element={
              <motion.div
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
              >
                <MealPlannerV2 />
              </motion.div>
            } />
            <Route path="/styleguide" element={
              <motion.div
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
              >
                <Styleguide />
              </motion.div>
            } />
            <Route path="/design-system-test" element={
              <motion.div
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
              >
                <DesignSystemTest />
              </motion.div>
            } />
          </Routes>
        </AnimatePresence>
      </main>

      <Navigation />
      <GlobalLoadingIndicator />
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary 
      title="Application Error"
      fallbackMessage="Something went wrong with the meal planner. Please try refreshing the page."
      showDetails={process.env.NODE_ENV === 'development'}
    >
      <SecurityHeaders />
      <LoadingProvider>
        <AccessibilityProvider enableSkipLinks={true} enableLiveRegions={true}>
          <NetworkResilienceProvider showStatusIndicator={false} showOfflineBanner={true}>
            <OptimisticUpdateProvider enableToasts={true} enableHistory={false}>
              <AuthProvider>
                <Router>
                  <AppContent />
                </Router>
              </AuthProvider>
            </OptimisticUpdateProvider>
          </NetworkResilienceProvider>
        </AccessibilityProvider>
      </LoadingProvider>
    </ErrorBoundary>
  )
}

export default App
