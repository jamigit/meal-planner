import React, { useState } from 'react'
import Button from './ui/Button'
import Card from './ui/Card'
import Input from './ui/Input'
import Heading from './ui/Heading'
import { joinClasses, colors, typography } from '../utils/designSystem'
import { getRecipeSelectionClasses, getTagFilterClasses } from '../utils/colorMigration'

export default function DesignSystemTest() {
  const [testValue, setTestValue] = useState('')
  const [isSelected, setIsSelected] = useState(false)

  return (
    <div className="space-y-8 p-6">
      <Heading as="h1" size="display-1">Design System Test</Heading>
      
      {/* Typography Test */}
      <Card variant="light">
        <Heading as="h2" size="heading-xl" className="mb-4">Typography</Heading>
        <div className="space-y-2">
          <div className={typography.display[1]}>Display 1 Text</div>
          <div className={typography.heading.lg}>Heading Large</div>
          <div className={typography.button.md}>Button Text</div>
          <div className={colors.text.primary}>Primary Text</div>
          <div className={colors.text.secondary}>Secondary Text</div>
          <div className={colors.text.tertiary}>Tertiary Text</div>
        </div>
      </Card>

      {/* Button Test */}
      <Card variant="surface">
        <Heading as="h2" size="heading-xl" className="mb-4">Buttons</Heading>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="tertiary">Tertiary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="outline">Outline</Button>
        </div>
        
        <div className="mt-4">
          <Heading as="h3" size="heading-md" className="mb-2">Button Sizes</Heading>
          <div className="flex flex-wrap gap-3 items-center">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </div>
        </div>
      </Card>

      {/* Input Test */}
      <Card variant="dark">
        <Heading as="h2" size="heading-xl" className="mb-4">Inputs on Dark Surface</Heading>
        <div className="space-y-3">
          <Input 
            surface="dark" 
            placeholder="Dark surface input"
            value={testValue}
            onChange={(e) => setTestValue(e.target.value)}
          />
          <div className="flex gap-3">
            <Button surface="dark" variant="primary">Dark Primary</Button>
            <Button surface="dark" variant="outline">Dark Outline</Button>
          </div>
        </div>
      </Card>

      {/* Recipe Selection Test */}
      <Card variant="light">
        <Heading as="h2" size="heading-xl" className="mb-4">Recipe Selection States</Heading>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={joinClasses(
            'border rounded-lg p-4 cursor-pointer transition-colors',
            getRecipeSelectionClasses(false, true)
          )}>
            <h3 className={colors.text.primary}>Available Recipe</h3>
            <p className={colors.text.secondary}>Can be selected</p>
          </div>
          
          <div className={joinClasses(
            'border rounded-lg p-4 cursor-pointer transition-colors',
            getRecipeSelectionClasses(true, true)
          )}>
            <h3 className={colors.text.inverse}>Selected Recipe</h3>
            <p className={colors.text.inverse}>Currently selected</p>
            <span className={joinClasses(colors.text.inverse, 'text-xl')}>✓</span>
          </div>
          
          <div className={joinClasses(
            'border rounded-lg p-4 transition-colors',
            getRecipeSelectionClasses(false, false)
          )}>
            <h3 className={colors.text.tertiary}>Disabled Recipe</h3>
            <p className={colors.text.tertiary}>Cannot be selected</p>
          </div>
        </div>
      </Card>

      {/* Tag Filter Test */}
      <Card variant="surface">
        <Heading as="h2" size="heading-xl" className="mb-4">Tag Filters</Heading>
        <div className="flex flex-wrap gap-2">
          <button className={getTagFilterClasses(true, 'cuisine')}>
            Italian (Active)
          </button>
          <button className={getTagFilterClasses(false, 'cuisine')}>
            Mexican (Inactive)
          </button>
          <button className={getTagFilterClasses(true, 'ingredients')}>
            Chicken (Active)
          </button>
          <button className={getTagFilterClasses(false, 'convenience')}>
            Quick (Inactive)
          </button>
        </div>
      </Card>

      {/* Color Tokens Test */}
      <Card variant="light">
        <Heading as="h2" size="heading-xl" className="mb-4">Color Tokens</Heading>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="w-full h-8 bg-surface-card rounded"></div>
            <p className="text-sm">surface-card</p>
          </div>
          <div className="space-y-2">
            <div className="w-full h-8 bg-semantic-success rounded"></div>
            <p className="text-sm">semantic-success</p>
          </div>
          <div className="space-y-2">
            <div className="w-full h-8 bg-semantic-error rounded"></div>
            <p className="text-sm">semantic-error</p>
          </div>
          <div className="space-y-2">
            <div className="w-full h-8 bg-state-hover rounded"></div>
            <p className="text-sm">state-hover</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
