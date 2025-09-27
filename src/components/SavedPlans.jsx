import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { serviceSelector } from '../services/serviceSelector.js'
import { emailService } from '../services/emailService.js'
import ShoppingListCard from './ShoppingListCard'
import RecipeCard from './RecipeCard'

function SavedPlans() {
  const [savedPlans, setSavedPlans] = useState([])
  const [eatenMeals, setEatenMeals] = useState(new Set()) // Track which meals are marked as eaten
  const [activeTabs, setActiveTabs] = useState({}) // Track active tab for each plan (meals/list)
  const [sidebarRecipe, setSidebarRecipe] = useState(null) // Recipe to show in sidebar
  const [openDropdowns, setOpenDropdowns] = useState(new Set()) // Track which dropdowns are open

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

  const loadPlans = async () => {
    const weeklyPlanService = await serviceSelector.getWeeklyPlanService()
    const plans = await weeklyPlanService.getAllWithRecipes()
    setSavedPlans(plans)
  }

  useEffect(() => {
    loadPlans()
  }, [])

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleDeletePlan = async (planId) => {
    if (confirm('Are you sure you want to delete this plan?')) {
      const weeklyPlanService = await serviceSelector.getWeeklyPlanService()
      await weeklyPlanService.delete(planId)
      loadPlans()
    }
  }

  const handleSetAsCurrent = async (planId) => {
    const weeklyPlanService = await serviceSelector.getWeeklyPlanService()
    await weeklyPlanService.setAsCurrent(planId)
    loadPlans()
  }

  const handleMarkAsEaten = async (recipe, planCreatedAt) => {
    try {
      // Use plan creation date as the week reference
      const eatenDate = new Date().toISOString().split('T')[0] // Today

      const mealHistoryService = await serviceSelector.getMealHistoryService()
      await mealHistoryService.addMealToHistory(recipe.id, eatenDate)

      // Add to eaten meals set for UI feedback
      setEatenMeals(prev => new Set([...prev, `${recipe.id}-${planCreatedAt}`]))

      console.log(`✅ Marked "${recipe.name}" as eaten`)

      // Optional: Show success feedback
      // Could add a toast notification here in the future

    } catch (error) {
      console.error('Failed to mark meal as eaten:', error)
      alert('Failed to mark meal as eaten. Please try again.')
    }
  }

  const handleResendEmail = async (plan) => {
    try {
      console.log('📧 Resending meal plan email...')
      const emailResults = await emailService.sendMealPlan(plan)
      
      const successCount = emailResults.filter(r => r.success).length
      const failCount = emailResults.filter(r => !r.success).length
      
      if (successCount > 0) {
        alert(`📧 Meal plan emailed to ${successCount} recipient${successCount !== 1 ? 's' : ''}!`)
      } else {
        alert('⚠️ Failed to send emails. Please check your email configuration.')
      }
    } catch (error) {
      console.error('Failed to resend email:', error)
      alert('⚠️ Failed to send email. Please try again later.')
    }
  }

  const isMealEaten = (recipeId, planCreatedAt) => {
    return eatenMeals.has(`${recipeId}-${planCreatedAt}`)
  }

  const getActiveTab = (planId) => {
    return activeTabs[planId] || 'meals'
  }

  const setActiveTab = (planId, tab) => {
    setActiveTabs(prev => ({ ...prev, [planId]: tab }))
  }

  const toggleDropdown = (planId) => {
    setOpenDropdowns(prev => {
      const newSet = new Set(prev)
      if (newSet.has(planId)) {
        newSet.delete(planId)
      } else {
        newSet.clear() // Close other dropdowns
        newSet.add(planId)
      }
      return newSet
    })
  }

  const closeDropdown = (planId) => {
    setOpenDropdowns(prev => {
      const newSet = new Set(prev)
      newSet.delete(planId)
      return newSet
    })
  }

  const isDropdownOpen = (planId) => {
    return openDropdowns.has(planId)
  }

  return (
    <div className="relative">
      <div className="mb-2">
        <h2 className="font-heading text-display-2 uppercase text-text-primary">Saved Plans</h2>
      </div>
      <p className="text-black mb-4">{savedPlans.length} saved plan{savedPlans.length !== 1 ? 's' : ''}</p>

      {savedPlans.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-black mb-4">No saved plans yet.</p>
          <p className="text-sm text-gray-400">
            Create a weekly plan and save it to see it here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {savedPlans.map((plan) => (
            <div key={plan.id} className={`card ${plan.is_current ? 'bg-green-600 text-white' : ''}`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`text-h5 font-heading font-black break-words whitespace-normal ${plan.is_current ? 'text-white' : 'text-text-primary'}`}>
                      {plan.name?.toString().trim() || `Plan from ${formatDate(plan.created_at)}`}
                    </h3>
                    {plan.is_current && (
                      <span className="bg-white text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                        Current
                      </span>
                    )}
                  </div>
                  <div className={`text-sm space-y-1 ${plan.is_current ? 'text-white' : 'text-black'}`}>
                    <p>
                      {plan.meals?.length || 0} meal{(plan.meals?.length || 0) !== 1 ? 's' : ''}
                    </p>
                    <p>
                      Created: {formatDate(plan.created_at)}
                    </p>
                  </div>
                </div>

                <div className="relative">
                  <button
                    onClick={() => toggleDropdown(plan.id)}
                    className="w-8 h-8 border-2 border-black rounded bg-white hover:bg-gray-50 transition-colors flex items-center justify-center"
                    title="More actions"
                  >
                    <span className="text-black text-lg leading-none">⋮</span>
                  </button>
                  
                  {isDropdownOpen(plan.id) && (
                    <>
                      {/* Backdrop to close dropdown */}
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => closeDropdown(plan.id)}
                      />
                      
                      {/* Dropdown menu */}
                      <div className="absolute right-0 top-10 z-20 bg-white border-2 border-black rounded-lg shadow-lg py-1 min-w-[160px]">
                        <button
                          onClick={() => {
                            handleResendEmail(plan)
                            closeDropdown(plan.id)
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors flex items-center gap-2"
                        >
                          <span>📧</span>
                          <span>Email Plan</span>
                        </button>
                        
                        {!plan.is_current && (
                          <button
                            onClick={() => {
                              handleSetAsCurrent(plan.id)
                              closeDropdown(plan.id)
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors flex items-center gap-2"
                          >
                            <span>⭐</span>
                            <span>Set as Current</span>
                          </button>
                        )}
                        
                        <button
                          onClick={() => {
                            handleDeletePlan(plan.id)
                            closeDropdown(plan.id)
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-700 transition-colors flex items-center gap-2"
                        >
                          <span>🗑️</span>
                          <span>Delete</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Toggle Tabs */}
              <div className="mb-4">
                <div className="relative inline-flex bg-[#e7911f] rounded-full p-1">
                  <button
                    onClick={() => setActiveTab(plan.id, 'meals')}
                    className={`relative z-10 px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                      getActiveTab(plan.id) === 'meals' ? 'bg-white text-black shadow' : 'text-black'
                    }`}
                  >
                    Meals ({plan.meals?.length || 0})
                  </button>
                  <button
                    onClick={() => setActiveTab(plan.id, 'shopping')}
                    className={`relative z-10 px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                      getActiveTab(plan.id) === 'shopping' ? 'bg-white text-black shadow' : 'text-black'
                    }`}
                  >
                    Shopping List
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              {getActiveTab(plan.id) === 'meals' && plan.meals && plan.meals.length > 0 && (
                <div className="mb-4">
                  <div className="grid grid-cols-1 gap-3">
                    {plan.meals.map((meal, index) => (
                      <div key={meal.id || index} className={`flex flex-col md:flex-row md:items-center md:justify-between p-3 rounded-lg ${plan.is_current ? 'bg-white' : 'bg-gray-50'}`}>
                        <div className="mb-3 md:mb-0 md:flex-1">
                          <span className="font-heading font-black break-words whitespace-normal text-black">{meal.name}</span>
                        </div>

                        <div className="flex items-center justify-end md:justify-start space-x-2 md:ml-4">
                          {isMealEaten(meal.id, plan.created_at) ? (
                            <span className="text-green-600 text-sm font-medium flex items-center">
                              <span className="text-green-600 mr-1">✓</span>
                              Eaten
                            </span>
                          ) : (
                            <button
                              onClick={() => handleMarkAsEaten(meal, plan.created_at)}
                              className="text-sm px-3 py-1 bg-[#a4e27c] text-black hover:brightness-95 rounded-full transition-colors"
                            >
                              Mark as Eaten
                            </button>
                          )}
                          
                          <button
                            onClick={() => setSidebarRecipe(meal)}
                            className="inline-flex items-center gap-2 border-2 border-black text-black rounded-lg font-heading font-black uppercase text-[14px] px-3 py-1 hover:bg-gray-50 transition-colors whitespace-nowrap"
                          >
                            View Recipe
                            <span className="material-symbols-rounded text-base">arrow_forward</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {getActiveTab(plan.id) === 'shopping' && (
                <div className="mb-4">
                  <ShoppingListCard
                    recipes={plan.meals || []}
                    weeklyPlanId={plan.id}
                    className="border-0 p-0 shadow-none bg-transparent"
                  />
                </div>
              )}

              {/* Notes */}
              {plan.notes && (
                <div>
                  <h4 className="text-h6 font-heading font-black text-text-primary mb-2">Notes:</h4>
                  <p className="text-black bg-gray-50 p-3 rounded whitespace-pre-wrap">
                    {plan.notes}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

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
              <h3 className="text-h3 font-heading font-black text-text-primary">Recipe Details</h3>
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

export default SavedPlans