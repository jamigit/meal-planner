import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { serviceSelector } from '../services/serviceSelector.js'
import { claudeAiService } from '../services/claudeAiService.js'
import { emailService } from '../services/emailService.js'
import RecipeSelector from './RecipeSelector'
import AISuggestionModal from './AISuggestionModal'
import ShoppingList from './ShoppingList'
import ShoppingListCard from './ShoppingListCard'
import CategorizedTags from './CategorizedTags'
import RecipeCard from './RecipeCard'

function WeeklyPlanner() {
  const navigate = useNavigate()
  const [weeklyPlan, setWeeklyPlan] = useState({
    meals: [],
    notes: '',
    name: ''
  })
  const [isRecipeSelectorOpen, setIsRecipeSelectorOpen] = useState(false)

  // AI Suggestion state
  const [showAIModal, setShowAIModal] = useState(false)
  const [aiSuggestions, setAISuggestions] = useState([])
  const [isLoadingAI, setIsLoadingAI] = useState(false)
  const [aiError, setAIError] = useState(null)
  
  // AI Toggle options
  const [aiToggles, setAiToggles] = useState({
    healthy: false,
    easy: false,
    spiceItUp: false,
    more: false
  })
  const [weekPreferences, setWeekPreferences] = useState('')


  // Shopping list state
  const [showShoppingList, setShowShoppingList] = useState(false)
  const [currentPlanId, setCurrentPlanId] = useState(null)
  const [mealEatenCounts, setMealEatenCounts] = useState({})
  const [sidebarRecipe, setSidebarRecipe] = useState(null) // Recipe to show in sidebar

  // Lock/unlock body scroll when sidebar opens/closes
  useEffect(() => {
    if (sidebarRecipe) {
      // Lock body scroll
      document.body.style.overflow = 'hidden'
    } else {
      // Unlock body scroll
      document.body.style.overflow = 'unset'
    }

    // Cleanup function to ensure scroll is unlocked when component unmounts
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [sidebarRecipe])

  useEffect(() => {
    const loadCurrentPlan = async () => {
      console.log('🔄 Loading current plan...')
      const weeklyPlanService = await serviceSelector.getWeeklyPlanService()
      const currentPlan = await weeklyPlanService.getCurrentWithRecipes()
      console.log('📋 Current plan found:', currentPlan)
      
      if (currentPlan) {
        // Ensure each meal has a scaling factor
        const mealsWithScaling = (currentPlan.meals || []).map(meal => ({
          ...meal,
          scaling: meal.scaling || 1
        }))
        console.log('🍽️ Setting meals:', mealsWithScaling)
        setWeeklyPlan({
          meals: mealsWithScaling,
          notes: currentPlan.notes || ''
        })
        setCurrentPlanId(currentPlan.id)
      } else {
        console.log('❌ No current plan found')
      }
    }

    loadCurrentPlan()
  }, [])

  // Load eaten counts whenever meals change
  useEffect(() => {
    const loadEatenCounts = async () => {
      if (weeklyPlan.meals.length > 0) {
        const mealHistoryService = await serviceSelector.getMealHistoryService()
        const mealIds = weeklyPlan.meals.map(meal => meal.id)
        const counts = await mealHistoryService.getRecipeEatenCounts(mealIds)
        setMealEatenCounts(counts)
      } else {
        setMealEatenCounts({})
      }
    }

    loadEatenCounts()
  }, [weeklyPlan.meals])

  const handleSelectRecipes = (selectedRecipes) => {
    // Add default scaling factor of 1 to each recipe
    const mealsWithScaling = selectedRecipes.map(recipe => ({
      ...recipe,
      scaling: recipe.scaling || 1
    }))
    setWeeklyPlan(prev => ({
      ...prev,
      meals: mealsWithScaling
    }))
    // Clear currentPlanId since this is now a new unsaved selection
    setCurrentPlanId(null)
  }

  const handleRemoveMeal = (mealId) => {
    setWeeklyPlan(prev => ({
      ...prev,
      meals: prev.meals.filter(meal => meal.id !== mealId)
    }))
    // Clear currentPlanId since this modifies the plan
    setCurrentPlanId(null)
  }

  const handleScalingChange = (mealId, newScaling) => {
    setWeeklyPlan(prev => ({
      ...prev,
      meals: prev.meals.map(meal =>
        meal.id === mealId
          ? { ...meal, scaling: parseInt(newScaling) }
          : meal
      )
    }))
    // Clear currentPlanId since this modifies the plan
    setCurrentPlanId(null)
  }

  const handleSavePlan = async () => {
    console.log('🔄 Starting save process with plan:', weeklyPlan)
    
    const weeklyPlanService = await serviceSelector.getWeeklyPlanService()
    
    // Clear any existing current plans first
    await weeklyPlanService.clearCurrentPlans()
    
    // Save the plan and set it as current
    const savedPlan = await weeklyPlanService.save(weeklyPlan, true)
    console.log('💾 Saved plan result:', savedPlan)
    
    if (savedPlan) {
      console.log('✅ Plan saved successfully, resetting state...')
      
      // Reset all weekly planner state
      setWeeklyPlan({
        meals: [],
        notes: '',
        name: ''
      })
      setWeekPreferences('')
      setMealEatenCounts({})
      setSidebarRecipe(null)
      setCurrentPlanId(null) // Clear current plan ID
      
      // Close any open modals
      setIsRecipeSelectorOpen(false)
      setShowAIModal(false)
      setShowShoppingList(false)
      
      // Clear AI suggestion state
      setAISuggestions([])
      setAIError(null)
      setIsLoadingAI(false)
      
      console.log('🧹 State reset complete, current state:', {
        meals: [],
        notes: '',
        currentPlanId: null
      })
      
      // Don't navigate immediately - let user see the reset
      alert('Weekly plan saved successfully! The planner has been reset.')
      
      // Optional: Navigate after a short delay
      setTimeout(() => {
        navigate('/saved-plans')
      }, 1000)
    } else {
      console.log('❌ Failed to save plan')
    }
  }

  const handleSavePlanWithEmail = async () => {
    console.log('🔄 Starting save process with email...')
    
    const weeklyPlanService = await serviceSelector.getWeeklyPlanService()
    
    // Clear any existing current plans first
    await weeklyPlanService.clearCurrentPlans()
    
    // Save the plan and set it as current
    const savedPlan = await weeklyPlanService.save(weeklyPlan, true)
    console.log('💾 Saved plan result:', savedPlan)
    
    if (savedPlan) {
      // Send email
      try {
        console.log('📧 Sending meal plan email...')
        const emailResults = await emailService.sendMealPlan(savedPlan)
        
        const successCount = emailResults.filter(r => r.success).length
        const failCount = emailResults.filter(r => !r.success).length
        
        let emailMessage = ''
        if (successCount > 0) {
          emailMessage += `📧 Meal plan emailed to ${successCount} recipient${successCount !== 1 ? 's' : ''}!`
        }
        if (failCount > 0) {
          emailMessage += failCount > 0 && successCount > 0 ? '\n' : ''
          emailMessage += `⚠️ Failed to send to ${failCount} recipient${failCount !== 1 ? 's' : ''}.`
        }
        
        console.log('✅ Plan saved successfully, resetting state...')
        
        // Reset all weekly planner state
        setWeeklyPlan({
          meals: [],
          notes: '',
          name: ''
        })
        setWeekPreferences('')
        setMealEatenCounts({})
        setSidebarRecipe(null)
        setCurrentPlanId(null)
        
        // Close any open modals
        setIsRecipeSelectorOpen(false)
        setShowAIModal(false)
        setShowShoppingList(false)
        
        // Clear AI suggestion state
        setAISuggestions([])
        setAIError(null)
        setIsLoadingAI(false)
        
        alert(`Weekly plan saved successfully! ${emailMessage}\n\nThe planner has been reset.`)
        
        setTimeout(() => {
          navigate('/saved-plans')
        }, 1000)
        
      } catch (error) {
        console.error('Failed to send email:', error)
        // Still show success for saving, but mention email failure
        alert('Weekly plan saved successfully!\n\n⚠️ Failed to send email. You can resend it from the Saved Plans page.')
        
        // Still reset and navigate
        setWeeklyPlan({ meals: [], notes: '', name: '' })
        setWeekPreferences('')
        setMealEatenCounts({})
        setSidebarRecipe(null)
        setCurrentPlanId(null)
        setIsRecipeSelectorOpen(false)
        setShowAIModal(false)
        setShowShoppingList(false)
        setAISuggestions([])
        setAIError(null)
        setIsLoadingAI(false)
        
        setTimeout(() => {
          navigate('/saved-plans')
        }, 1000)
      }
    } else {
      console.log('❌ Failed to save plan')
    }
  }

  const handleShowShoppingList = () => {
    if (weeklyPlan.meals.length === 0) {
      alert('Please add some meals to your weekly plan first.')
      return
    }
    setShowShoppingList(true)
  }

  // Toggle handler
  const handleToggleChange = (toggleName) => {
    setAiToggles(prev => ({
      ...prev,
      [toggleName]: !prev[toggleName]
    }))
  }

  // AI Suggestion handlers
  const handleGetAISuggestions = async () => {
    setIsLoadingAI(true)
    setAIError(null)
    setShowAIModal(true)
    setAISuggestions([])

    try {
      console.log('🤖 Requesting AI suggestions with preferences:', weekPreferences, 'toggles:', aiToggles)
      const result = await claudeAiService.generateMealSuggestions(weekPreferences, aiToggles)
      console.log('📋 AI service result:', result)

      if (result.success) {
        setAISuggestions(result.data)
        console.log('✅ AI suggestions generated:', result.data)
      } else {
        console.log('❌ AI service failed, checking fallback...', result)
        setAIError(result.error)
        // Try to use fallback suggestions if available
        if (result.fallback && result.fallback.length > 0) {
          console.log('🎲 Using fallback suggestions:', result.fallback)
          setAISuggestions(result.fallback)
          setAIError(`${result.error} (showing fallback suggestions)`)
        } else {
          console.log('❌ No fallback suggestions available')
        }
      }
    } catch (error) {
      console.error('❌ Exception thrown in AI suggestions:', error)
      console.log('🔄 Trying to generate fallback manually...')
      
      // If an exception was thrown, try to get fallback suggestions manually
      try {
        const fallbackSuggestions = await claudeAiService.getFallbackSuggestions()
        if (fallbackSuggestions && fallbackSuggestions.length > 0) {
          console.log('✅ Manual fallback succeeded:', fallbackSuggestions)
          setAISuggestions(fallbackSuggestions)
          setAIError('AI service unavailable (showing backup suggestions)')
        } else {
          console.log('❌ Manual fallback also failed')
          setAIError('Unable to generate suggestions. Please try again later.')
        }
      } catch (fallbackError) {
        console.error('❌ Manual fallback failed:', fallbackError)
        setAIError('Unable to generate suggestions. Please try again later.')
      }
    } finally {
      setIsLoadingAI(false)
    }
  }

  const handleSelectAIMeals = (selectedRecipes) => {
    console.log('🍽️ Selected AI meals:', selectedRecipes)
    // Add default scaling factor of 1 to each recipe
    const mealsWithScaling = selectedRecipes.map(recipe => ({
      ...recipe,
      scaling: recipe.scaling || 1
    }))
    setWeeklyPlan(prev => ({
      ...prev,
      meals: mealsWithScaling
    }))
    // Clear currentPlanId since this is now a new unsaved selection
    setCurrentPlanId(null)
    setShowAIModal(false)
  }

  const handleCloseAIModal = () => {
    setShowAIModal(false)
    setAISuggestions([])
    setAIError(null)
    setIsLoadingAI(false)
  }

  // Mark meal as eaten from current plan
  const handleMarkMealAsEaten = async (meal) => {
    try {
      const mealHistoryService = await serviceSelector.getMealHistoryService()
      const eatenDate = new Date().toISOString().split('T')[0] // Today
      await mealHistoryService.addMealToHistory(meal.id, eatenDate)

      console.log(`✅ Marked "${meal.name}" as eaten from current plan`)

      // Optional: Remove from current plan or show visual feedback
      // For now, just log success
    } catch (error) {
      console.error('Failed to mark meal as eaten:', error)
      alert('Failed to mark meal as eaten. Please try again.')
    }
  }

  return (
    <div className="mt-16 md:mt-24 relative pb-[200px]">
      <img
        src="/images/kiwi-hero.png"
        alt="Kiwi hero"
        className="pointer-events-none select-none absolute -top-28 max-[500px]:-top-20 md:-top-40 right-0 max-[500px]:-right-20 md:-right-20 w-72 h-72 md:w-96 md:h-96 object-contain transform -scale-x-100 z-[-1]"
      />
      <div className="mt-16 mb-10 relative z-10">
        <h2 className="font-heading text-display-2 uppercase text-black">
          {weeklyPlan.name ? `${weeklyPlan.name} - Weekly Planner` : 'Weekly Planner'}
        </h2>
      </div>

      {/* AI Suggestion Section */}
      <div className="card mb-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><span className="material-symbols-rounded text-[28px]">robot_2</span> AI-Powered Meal Suggestions</h3>
        <p className="text-black mb-4">
          Get personalized meal recommendations based on your history and preferences
        </p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-black mb-2">
            Weekly Preferences (optional)
          </label>
          <textarea
            value={weekPreferences}
            onChange={(e) => setWeekPreferences(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows="3"
            placeholder="Any preferences for this week? (e.g., 'feeling like healthy meals', 'have chicken in fridge', 'want something quick')"
          />
        </div>

        {/* AI Toggle Options */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-black mb-3">
            Customize Suggestions
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Healthy Toggle */}
            <motion.button
              onClick={() => handleToggleChange('healthy')}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                aiToggles.healthy
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 bg-white text-black hover:border-gray-300'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                aiToggles.healthy
                  ? 'border-green-500 bg-green-500'
                  : 'border-gray-300'
              }`}>
                {aiToggles.healthy && (
                  <span className="text-white text-xs">✓</span>
                )}
              </div>
              <span className="text-sm font-medium">🥗 Healthy</span>
            </motion.button>

            {/* Easy Toggle */}
            <motion.button
              onClick={() => handleToggleChange('easy')}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                aiToggles.easy
                  ? 'border-green-600 bg-green-50 text-green-700'
                  : 'border-gray-200 bg-white text-black hover:border-gray-300'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                aiToggles.easy
                  ? 'border-green-600 bg-green-600'
                  : 'border-gray-300'
              }`}>
                {aiToggles.easy && (
                  <span className="text-white text-xs">✓</span>
                )}
              </div>
              <span className="text-sm font-medium">⚡ Easy</span>
            </motion.button>

            {/* Spice It Up Toggle */}
            <motion.button
              onClick={() => handleToggleChange('spiceItUp')}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                aiToggles.spiceItUp
                  ? 'border-orange-500 bg-orange-50 text-orange-700'
                  : 'border-gray-200 bg-white text-black hover:border-gray-300'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                aiToggles.spiceItUp
                  ? 'border-orange-500 bg-orange-500'
                  : 'border-gray-300'
              }`}>
                {aiToggles.spiceItUp && (
                  <span className="text-white text-xs">✓</span>
                )}
              </div>
              <span className="text-sm font-medium">🌶️ Spice It Up</span>
            </motion.button>

            {/* More Toggle */}
            <motion.button
              onClick={() => handleToggleChange('more')}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                aiToggles.more
                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                  : 'border-gray-200 bg-white text-black hover:border-gray-300'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                aiToggles.more
                  ? 'border-purple-500 bg-purple-500'
                  : 'border-gray-300'
              }`}>
                {aiToggles.more && (
                  <span className="text-white text-xs">✓</span>
                )}
              </div>
              <span className="text-sm font-medium">➕ More</span>
            </motion.button>
          </div>
        </div>

        <motion.button
          onClick={handleGetAISuggestions}
          disabled={isLoadingAI}
          className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          {isLoadingAI ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
              Generating Suggestions...
            </>
          ) : (
            <>Get AI Suggestions</>
          )}
        </motion.button>
      </div>


      {/* Selected Meals and Shopping List Section - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">
            {weeklyPlan.name ? `${weeklyPlan.name} - Selected Meals` : 'Selected Meals'}
          </h3>
          {weeklyPlan.meals.length === 0 ? (
            <p className="text-black">No meals selected yet.</p>
          ) : (
            <div className="space-y-6">
              <AnimatePresence>
                {weeklyPlan.meals.map((meal, index) => (
                  <motion.div 
                    key={meal.id} 
                  className="p-5 bg-brand-surface rounded"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ 
                      duration: 0.3,
                      delay: index * 0.1 
                    }}
                  >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h4 className="font-black text-[20px]">{meal.name}</h4>
                      {mealEatenCounts[meal.id] !== undefined && (
                        <div className="text-sm text-black mt-1">
                          Eaten {mealEatenCounts[meal.id]} times in last 8 weeks
                        </div>
                      )}
                      <div className="flex items-center mt-2">
                        <label className="text-sm text-black mr-2">Servings:</label>
                        <select
                          value={meal.scaling || 1}
                          onChange={(e) => handleScalingChange(meal.id, e.target.value)}
                          className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
                        >
                          <option value={1}>1x</option>
                          <option value={2}>2x</option>
                          <option value={3}>3x</option>
                          <option value={4}>4x</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <button
                        onClick={() => handleRemoveMeal(meal.id)}
                        className="inline-flex items-center gap-1 text-black bg-transparent border-2 border-black rounded px-2 py-1 text-sm transition-colors hover:bg-transparent"
                      >
                        <span className="material-symbols-rounded text-base text-black">close</span>
                        Remove
                      </button>
                    </div>
                  </div>

                  <CategorizedTags recipe={meal} className="mb-3" />

                  {/* Recipe Links */}
                  <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setSidebarRecipe(meal)}
                        className="inline-flex items-center justify-center gap-2 rounded-lg font-heading font-black uppercase text-[14px] px-3 py-1 border-2 border-black text-black hover:bg-gray-50 transition-colors"
                      >
                      View Recipe
                      <span className="material-symbols-rounded text-base">arrow_forward</span>
                    </button>
                    {meal.url && (
                      <a
                        href={meal.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-black hover:text-black/80 text-sm flex items-center gap-1"
                        title="Open original recipe in new window"
                      >
                        Open Original
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    )}
                  </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
          <button
            onClick={() => setIsRecipeSelectorOpen(true)}
            className="btn-secondary mt-4"
          >
            Select Meals
          </button>
        </div>

        {/* Shopping List Card */}
        <div>
          <ShoppingListCard
            recipes={weeklyPlan.meals}
            weeklyPlanId={currentPlanId}
            showTitle={true}
          />
        </div>
      </div>

      {/* Notes Section - Full Width */}
      <div className="card mb-6">
        <h3 className="text-lg font-semibold mb-4">Notes</h3>
        <textarea
          value={weeklyPlan.notes}
          onChange={(e) => setWeeklyPlan(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Add any notes about your meal plan..."
          className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Meal Plan Name Section - Full Width */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Meal Plan Name (Optional)</h3>
        <p className="text-black mb-4">
          Give your meal plan a custom name. If left blank, it will use a default name with the creation date.
        </p>
        <input
          type="text"
          value={weeklyPlan.name}
          onChange={(e) => setWeeklyPlan(prev => ({ ...prev, name: e.target.value }))}
          placeholder="e.g., 'Healthy Week', 'Quick Meals', 'Family Favorites'"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <RecipeSelector
        isOpen={isRecipeSelectorOpen}
        onClose={() => setIsRecipeSelectorOpen(false)}
        onSelectRecipes={handleSelectRecipes}
        selectedMealIds={weeklyPlan.meals.map(meal => meal.id).filter(Boolean)}
      />

      <AISuggestionModal
        isOpen={showAIModal}
        onClose={handleCloseAIModal}
        suggestions={aiSuggestions}
        onSelectMeals={handleSelectAIMeals}
        isLoading={isLoadingAI}
        error={aiError}
      />

      {/* Save Plan Buttons at Bottom */}
      <div className="mt-8 text-center space-x-4">
        <button onClick={handleSavePlan} className="btn-tertiary">
          Save Plan Only
        </button>
        <button onClick={handleSavePlanWithEmail} className="btn-primary">
          Save & Email Plan
        </button>
      </div>

      {/* Sidebar Backdrop */}
      <AnimatePresence>
        {sidebarRecipe && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50"
            style={{ zIndex: 1000 }}
            onClick={() => setSidebarRecipe(null)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>

      {/* Recipe Sidebar */}
      <AnimatePresence>
        {sidebarRecipe && (
          <motion.div 
            className="fixed inset-y-0 right-0 w-96 bg-brand-surface shadow-xl border-l border-gray-200 flex flex-col"
            style={{ zIndex: 1001 }}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ 
              type: "spring", 
              damping: 25, 
              stiffness: 300,
              duration: 0.4 
            }}
          >
          {/* Fixed Header */}
          <div className="sticky top-0 flex-shrink-0 p-4 border-b border-gray-200 bg-brand-surface z-10">
            <div className="flex justify-between items-center">
              <h3 className="!text-[32px] font-semibold text-black">Recipe Details</h3>
              <button
                onClick={() => setSidebarRecipe(null)}
                className="btn-outline-black-sm flex items-center gap-2"
              >
                <span>×</span>
                <span>Close</span>
              </button>
            </div>
          </div>
          
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4">
            <RecipeCard
              recipe={sidebarRecipe}
              showDetails={true}
            />
          </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}

export default WeeklyPlanner