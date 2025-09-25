import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { isSupabaseConfigured } from '../lib/supabase.js'

function Navigation() {
  const location = useLocation()
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false)
  const { signOut } = useAuth()
  const supabaseConfigured = isSupabaseConfigured()

  const handleLogout = async () => {
    await signOut()
  }

  const isMoreActive = location.pathname === '/recipes' || location.pathname === '/meal-history'

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div />
            <div className="flex space-x-4 items-center">
              <Link
                to="/"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  location.pathname === '/'
                    ? 'bg-stone-700 text-white'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                Weekly Planner
              </Link>
              <Link
                to="/saved-plans"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  location.pathname === '/saved-plans'
                    ? 'bg-stone-700 text-white'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                Saved Plans
              </Link>
              <Link
                to="/recipes"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  location.pathname === '/recipes'
                    ? 'bg-stone-700 text-white'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                Recipes
              </Link>
              <Link
                to="/meal-history"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  location.pathname === '/meal-history'
                    ? 'bg-stone-700 text-white'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                Meal History
              </Link>
              {supabaseConfigured && (
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 rounded-md text-sm font-medium text-stone-300 hover:text-white hover:bg-stone-700"
                >
                  Logout
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Header removed per design */}

      {/* Sticky Bottom Navigation (mobile + desktop) */}
      <div className="fixed bottom-0 left-0 right-0 md:bottom-4 z-50 flex justify-center pointer-events-none">
        <div className="inline-flex bg-stone-900 border border-stone-800 rounded-t-2xl md:rounded-2xl shadow-lg px-3 md:px-3 py-3 md:py-3 pointer-events-auto font-heading uppercase">
        {/* More Menu Overlay */}
        {isMoreMenuOpen && (
          <div className="absolute bottom-full left-0 right-0 bg-stone-900 border-t border-stone-800 shadow-lg z-50">
            <div className="px-4 py-2 space-y-1 text-stone-200">
              <Link
                to="/recipes"
                className={`flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === '/recipes'
                    ? 'bg-stone-700 text-white'
                    : 'text-stone-300 hover:bg-stone-800'
                }`}
                onClick={() => setIsMoreMenuOpen(false)}
              >
                <span className="material-symbols-rounded mr-3 text-lg" aria-hidden>menu_book</span>
                Recipes
              </Link>
              <Link
                to="/meal-history"
                className={`flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === '/meal-history'
                    ? 'bg-stone-700 text-white'
                    : 'text-stone-300 hover:bg-stone-800'
                }`}
                onClick={() => setIsMoreMenuOpen(false)}
              >
                <span className="material-symbols-rounded mr-3 text-lg" aria-hidden>history</span>
                Meal History
              </Link>
            </div>
          </div>
        )}

        {/* Bottom Nav Tabs */}
        <div className="flex items-center justify-center gap-2">
          {/* Weekly Planner */}
          <Link
            to="/"
            className={`flex flex-col items-center justify-center w-14 h-14 min-[500px]:w-16 min-[500px]:h-16 p-2 text-[10px] md:text-xs font-medium transition-colors rounded-lg mx-1 border border-white/30 ${
              location.pathname === '/'
                ? 'bg-white/10 text-white'
                : 'text-stone-200 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span className="mb-1" aria-hidden>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1V3a1 1 0 0 1 1-1Zm12 7H5v10h14V9Zm-2-3H7v1a1 1 0 1 1-2 0V6H5h14h0v1a1 1 0 1 1-2 0V6Z" />
              </svg>
            </span>
            <span>Planner</span>
          </Link>

          {/* Saved Plans */}
          <Link
            to="/saved-plans"
            className={`flex flex-col items-center justify-center w-14 h-14 min-[500px]:w-16 min-[500px]:h-16 p-2 text-[10px] md:text-xs font-medium transition-colors rounded-lg mx-1 border border-white/30 ${
              location.pathname === '/saved-plans'
                ? 'bg-white/10 text-white'
                : 'text-stone-200 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span className="mb-1" aria-hidden>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7.828a2 2 0 0 0-.586-1.414l-2.828-2.828A2 2 0 0 0 16.172 3H5Zm0 2h10v4H5V5Zm0 6h14v8H5v-8Zm9-6h2.172L19 6.828V9h-5V5Z" />
              </svg>
            </span>
            <span>Plans</span>
          </Link>

          {/* Recipes (show until viewport < 400px) */}
          <Link
            to="/recipes"
            className={`flex max-[400px]:hidden flex-col items-center justify-center w-14 h-14 min-[500px]:w-16 min-[500px]:h-16 p-2 text-xs font-medium transition-colors rounded-lg mx-1 border border-white/30 ${
              location.pathname === '/recipes' ? 'bg-white/10 text-white' : 'text-stone-200 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span className="mb-1" aria-hidden>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 4h9a2 2 0 0 1 2 2v12h1a1 1 0 1 1 0 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm0 2v12h9V6H6Zm2 2h5v2H8V8Zm0 4h5v2H8v-2Z"/>
              </svg>
            </span>
            <span>Recipes</span>
          </Link>

          {/* History (show until viewport < 400px) */}
          <Link
            to="/meal-history"
            className={`flex max-[400px]:hidden flex-col items-center justify-center w-14 h-14 min-[500px]:w-16 min-[500px]:h-16 p-2 text-xs font-medium transition-colors rounded-lg mx-1 border border-white/30 ${
              location.pathname === '/meal-history' ? 'bg-white/10 text-white' : 'text-stone-200 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span className="mb-1" aria-hidden>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 8a1 1 0 0 1 1 1v3.586l2.121 2.121a1 1 0 0 1-1.414 1.414l-2.414-2.414A2 2 0 0 1 10 12V9a1 1 0 0 1 1-1Zm0-6a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z"/>
              </svg>
            </span>
            <span>History</span>
          </Link>

          {/* More Menu (only under 400px) */}
          <button
            onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
            className={`hidden max-[400px]:flex flex-col items-center justify-center w-14 h-14 p-2 text-[10px] font-medium transition-colors rounded-lg mx-1 border border-white/30 ${
              isMoreActive || isMoreMenuOpen
                ? 'bg-white/10 text-white'
                : 'text-stone-200 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span className="mb-1" aria-hidden>
              {isMoreMenuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 6a1 1 0 1 1 1.414-1.414L12 9.172l4.586-4.586A1 1 0 0 1 18 6l-4.586 4.586L18 15.172A1 1 0 0 1 16.586 16.586L12 12l-4.586 4.586A1 1 0 1 1 6 15.172l4.586-4.586L6 6Z"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 6a2 2 0 1 1 0-4 2 2 0 0 1 0 4Zm0 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4Zm0 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z"/>
                </svg>
              )}
            </span>
            <span>More</span>
          </button>
        </div>
        </div>
      </div>
    </>
  )
}

export default Navigation