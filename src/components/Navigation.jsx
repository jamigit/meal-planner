import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { isSupabaseConfigured } from '../lib/supabase.js'

function Navigation() {
  const location = useLocation()
  const [isHamburgerMenuOpen, setIsHamburgerMenuOpen] = useState(false)
  const { signOut } = useAuth()
  const supabaseConfigured = isSupabaseConfigured()

  const handleLogout = async () => {
    await signOut()
  }

  const isHamburgerActive = location.pathname === '/meal-history' || location.pathname === '/tag-management'

  // Close hamburger menu when screen size changes
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 400 && isHamburgerMenuOpen) {
        setIsHamburgerMenuOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isHamburgerMenuOpen])

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
                AI Planner
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
      <div className="fixed bottom-4 left-0 right-0 md:bottom-4 z-50 flex justify-center pointer-events-none">
        <div className="inline-flex w-[90vw] max-w-md bg-stone-900 border border-stone-800 shadow-lg pointer-events-auto font-heading uppercase rounded-2xl">

        {/* Bottom Nav Tabs */}
        <div className="flex items-center justify-around flex-1">
          {/* AI Planner */}
          <Link
            to="/"
            className={`flex flex-col items-center justify-center flex-1 h-16 md:h-20 p-3 text-[10px] md:text-xs font-medium transition-colors border-r border-white/30 rounded-l-2xl ${
              location.pathname === '/'
                ? 'bg-white/10 text-white'
                : 'text-stone-200 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span className="mb-1" aria-hidden>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </span>
            <span>Planner</span>
          </Link>

          {/* Saved Plans */}
          <Link
            to="/saved-plans"
            className={`flex flex-col items-center justify-center flex-1 h-16 md:h-20 p-3 text-[10px] md:text-xs font-medium transition-colors border-r border-white/30 ${
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

          {/* Shopping List (show until viewport < 400px) */}
          <Link
            to="/shopping-list"
            className={`flex max-[400px]:hidden flex-col items-center justify-center flex-1 h-16 md:h-20 p-3 text-[10px] md:text-xs font-medium transition-colors border-r border-white/30 ${
              location.pathname === '/shopping-list' ? 'bg-white/10 text-white' : 'text-stone-200 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span className="mb-1" aria-hidden>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01"/>
              </svg>
            </span>
            <span>Shopping</span>
          </Link>

          {/* Recipes */}
          <Link
            to="/recipes"
            className={`flex flex-col items-center justify-center flex-1 h-16 md:h-20 p-3 text-[10px] md:text-xs font-medium transition-colors border-r border-white/30 ${
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




          {/* Hamburger Menu */}
          <div className="relative z-50">
            <button
              onClick={() => setIsHamburgerMenuOpen(!isHamburgerMenuOpen)}
              className={`flex flex-col items-center justify-center flex-1 h-16 md:h-20 p-3 text-[10px] md:text-xs font-medium transition-colors rounded-r-2xl ${
                isHamburgerActive || isHamburgerMenuOpen
                  ? 'bg-white/10 text-white'
                  : 'text-stone-200 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="mb-1" aria-hidden>
                {isHamburgerMenuOpen ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2">
                    <path d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2">
                    <path d="M3 12h18M3 6h18M3 18h18"/>
                  </svg>
                )}
              </span>
              <span className="text-white">Menu</span>
            </button>
            
            {/* Hamburger Menu Popup */}
            {isHamburgerMenuOpen && (
              <div className="absolute bottom-full right-0 mb-2 bg-stone-900 border border-stone-800 shadow-lg z-[60] rounded-2xl overflow-hidden min-w-[200px]">
                <div className="flex flex-col text-stone-200">
                  <Link
                    to="/meal-history"
                    className={`flex items-center justify-center h-16 p-3 text-[10px] font-medium transition-colors border-b border-white/30 ${
                      location.pathname === '/meal-history'
                        ? 'bg-white/10 text-white'
                        : 'text-stone-200 hover:bg-white/10 hover:text-white'
                    }`}
                    onClick={() => setIsHamburgerMenuOpen(false)}
                  >
                    <span className="mr-2" aria-hidden>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 8a1 1 0 0 1 1 1v3.586l2.121 2.121a1 1 0 0 1-1.414 1.414l-2.414-2.414A2 2 0 0 1 10 12V9a1 1 0 0 1 1-1zM12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/>
                      </svg>
                    </span>
                    <span>History</span>
                  </Link>
                  <Link
                    to="/tag-management"
                    className={`flex items-center justify-center h-16 p-3 text-[10px] font-medium transition-colors ${
                      location.pathname === '/tag-management'
                        ? 'bg-white/10 text-white'
                        : 'text-stone-200 hover:bg-white/10 hover:text-white'
                    }`}
                    onClick={() => setIsHamburgerMenuOpen(false)}
                  >
                    <span className="mr-2" aria-hidden>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
                      </svg>
                    </span>
                    <span>Tags</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </>
  )
}

export default Navigation