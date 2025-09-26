// EmailJS service for sending meal plan emails
// You'll need to install: npm install @emailjs/browser
// And set up EmailJS account at https://www.emailjs.com/

class EmailService {
  constructor() {
    // EmailJS credentials
    this.serviceId = 'service_zqg7sph'
    this.templateId = 'template_tc8gdji'
    this.publicKey = 'drUTHyWLB_reWza1i'
    
    // Hardcoded email addresses for now (as requested)
    this.emailAddresses = [
      'jamiehbarter@gmail.com'
      // Add more email addresses as needed
    ]
  }

  // Initialize EmailJS (call this once in your app)
  async initialize() {
    try {
      // Check if EmailJS is available
      if (typeof window === 'undefined') {
        console.warn('EmailJS only works in browser environment')
        return false
      }

      // Import EmailJS dynamically to avoid build errors if not installed
      const emailjs = await import('@emailjs/browser')
      emailjs.default.init(this.publicKey)
      this.emailjs = emailjs.default
      return true
    } catch (error) {
      console.warn('EmailJS not available. Please install it by running: npm install @emailjs/browser')
      console.warn('Error:', error.message)
      return false
    }
  }

  // Format meal plan for email
  formatMealPlan(plan) {
    const planName = plan.name?.toString().trim() || `Meal Plan from ${new Date(plan.created_at).toLocaleDateString()}`
    
    let mealsList = ''
    let ingredientsList = ''
    
    if (plan.meals && plan.meals.length > 0) {
      // Create meals list
      mealsList = plan.meals.map((meal, index) => {
        const scaling = meal.scaling && meal.scaling !== 1 ? ` (${meal.scaling}x servings)` : ''
        return `${index + 1}. ${meal.name}${scaling}`
      }).join('\n')

      // Create combined ingredients list
      const allIngredients = new Map()
      
      plan.meals.forEach(meal => {
        if (meal.ingredients && meal.ingredients.length > 0) {
          meal.ingredients.forEach(ingredient => {
            const scaling = meal.scaling || 1
            const ingredientText = ingredient.trim()
            
            if (ingredientText) {
              // If ingredient already exists, add a note about multiple recipes
              if (allIngredients.has(ingredientText)) {
                const existing = allIngredients.get(ingredientText)
                if (scaling > 1) {
                  allIngredients.set(ingredientText, `${existing} (also needed ${scaling}x for ${meal.name})`)
                } else {
                  allIngredients.set(ingredientText, `${existing} (also for ${meal.name})`)
                }
              } else {
                if (scaling > 1) {
                  allIngredients.set(ingredientText, `${ingredientText} (${scaling}x for ${meal.name})`)
                } else {
                  allIngredients.set(ingredientText, ingredientText)
                }
              }
            }
          })
        }
      })

      if (allIngredients.size > 0) {
        ingredientsList = Array.from(allIngredients.values())
          .sort()
          .map((ingredient, index) => `${index + 1}. ${ingredient}`)
          .join('\n')
      } else {
        ingredientsList = 'No ingredients listed for these meals'
      }
    } else {
      mealsList = 'No meals in this plan'
      ingredientsList = 'No ingredients available'
    }

    const notes = plan.notes ? `\n\nNotes:\n${plan.notes}` : ''
    
    return {
      planName,
      mealsList,
      ingredientsList,
      notes,
      createdDate: new Date(plan.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }
  }

  // Send meal plan email to all configured addresses
  async sendMealPlan(plan) {
    if (!this.emailjs) {
      const initialized = await this.initialize()
      if (!initialized) {
        throw new Error('EmailJS not available. Please install the package by running: npm install @emailjs/browser')
      }
    }

    const formattedPlan = this.formatMealPlan(plan)
    const results = []

    for (const email of this.emailAddresses) {
      try {
        const templateParams = {
          to_email: email,
          plan_name: formattedPlan.planName,
          meals_list: formattedPlan.mealsList,
          ingredients_list: formattedPlan.ingredientsList,
          notes: formattedPlan.notes,
          created_date: formattedPlan.createdDate,
          meal_count: plan.meals?.length || 0
        }

        const response = await this.emailjs.send(
          this.serviceId,
          this.templateId,
          templateParams
        )

        results.push({
          email,
          success: true,
          response
        })

        console.log(`✅ Email sent successfully to ${email}:`, response)
      } catch (error) {
        results.push({
          email,
          success: false,
          error: error.message
        })
        console.error(`❌ Failed to send email to ${email}:`, error)
      }
    }

    return results
  }

  // Get configured email addresses
  getEmailAddresses() {
    return [...this.emailAddresses]
  }

  // Add email address (for future enhancement)
  addEmailAddress(email) {
    if (!this.emailAddresses.includes(email)) {
      this.emailAddresses.push(email)
    }
  }

  // Remove email address (for future enhancement)
  removeEmailAddress(email) {
    const index = this.emailAddresses.indexOf(email)
    if (index > -1) {
      this.emailAddresses.splice(index, 1)
    }
  }
}

// Export singleton instance
export const emailService = new EmailService()
export default EmailService
