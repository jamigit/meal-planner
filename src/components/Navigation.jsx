import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'

function Navigation() {
  const location = useLocation()
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false)

  const isMoreActive = location.pathname === '/recipes' || location.pathname === '/meal-history'

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:block bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-gray-900">Meal Planner</h1>
            <div className="flex space-x-4">
              <Link
                to="/"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  location.pathname === '/'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Weekly Planner
              </Link>
              <Link
                to="/saved-plans"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  location.pathname === '/saved-plans'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Saved Plans
              </Link>
              <Link
                to="/recipes"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  location.pathname === '/recipes'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Recipes
              </Link>
              <Link
                to="/meal-history"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  location.pathname === '/meal-history'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Meal History
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3">
        <h1 className="text-lg font-bold text-gray-900 text-center">Meal Planner</h1>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        {/* More Menu Overlay */}
        {isMoreMenuOpen && (
          <div className="absolute bottom-full left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
            <div className="px-4 py-2 space-y-1">
              <Link
                to="/recipes"
                className={`flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === '/recipes'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
                onClick={() => setIsMoreMenuOpen(false)}
              >
                <span className="mr-3 text-lg">📚</span>
                Recipes
              </Link>
              <Link
                to="/meal-history"
                className={`flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === '/meal-history'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
                onClick={() => setIsMoreMenuOpen(false)}
              >
                <span className="mr-3 text-lg">📊</span>
                Meal History
              </Link>
            </div>
          </div>
        )}

        {/* Bottom Nav Tabs */}
        <div className="flex">
          {/* Weekly Planner */}
          <Link
            to="/"
            className={`flex-1 flex flex-col items-center py-2 px-1 text-xs font-medium transition-colors ${
              location.pathname === '/'
                ? 'text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="text-xl mb-1">📅</span>
            <span>Planner</span>
          </Link>

          {/* Saved Plans */}
          <Link
            to="/saved-plans"
            className={`flex-1 flex flex-col items-center py-2 px-1 text-xs font-medium transition-colors ${
              location.pathname === '/saved-plans'
                ? 'text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="text-xl mb-1">💾</span>
            <span>Plans</span>
          </Link>

          {/* More Menu */}
          <button
            onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
            className={`flex-1 flex flex-col items-center py-2 px-1 text-xs font-medium transition-colors ${
              isMoreActive || isMoreMenuOpen
                ? 'text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="text-xl mb-1">
              {isMoreMenuOpen ? '✕' : '⋯'}
            </span>
            <span>More</span>
          </button>
        </div>
      </div>
    </>
  )
}

export default Navigation