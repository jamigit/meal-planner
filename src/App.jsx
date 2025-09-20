import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navigation from './components/Navigation'
import RecipeList from './components/RecipeList'
import WeeklyPlanner from './components/WeeklyPlanner'
import SavedPlans from './components/SavedPlans'
import MealHistory from './components/MealHistory'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<WeeklyPlanner />} />
            <Route path="/recipes" element={<RecipeList />} />
            <Route path="/saved-plans" element={<SavedPlans />} />
            <Route path="/meal-history" element={<MealHistory />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
