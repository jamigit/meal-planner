import React, { useState } from 'react'
import Heading from './ui/Heading'
import Button from './ui/Button'
import Card from './ui/Card'
import Input from './ui/Input'
import Toggle from './ui/Toggle'
import Tabs from './ui/Tabs'
import RecipeCard from './RecipeCard'
import CategorizedTags from './CategorizedTags'

export default function Styleguide() {
  const [on, setOn] = useState(false)
  const demoRecipe = {
    id: 'demo',
    name: 'Demo Recipe With Expandable Content',
    url: 'https://example.com',
    prep_time: 15,
    cook_time: 25,
    servings: 4,
    cuisine_tags: ['italian'],
    ingredient_tags: ['chicken','tomato'],
    convenience_tags: ['quick'],
    ingredients: ['2 chicken breasts','1 cup cherry tomatoes','2 tbsp olive oil','Salt & pepper'],
    instructions: ['Season chicken','Sear until browned','Add tomatoes and simmer','Serve hot']
  }
  return (
    <div className="space-y-8">
      <Heading as="h1" size="display-1">Styleguide</Heading>

      <section>
        <Heading as="h2" size="display-2">Buttons (light)</Heading>
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="tertiary">Tertiary</Button>
          <Button variant="outline">Outline</Button>
        </div>
      </section>

      <section className="p-4 rounded-xl bg-stone-900 text-white">
        <Heading as="h2" size="display-2">Buttons (dark surface)</Heading>
        <div className="flex flex-wrap items-center gap-3">
          <Button surface="dark">Primary</Button>
          <Button surface="dark" variant="secondary">Secondary</Button>
          <Button surface="dark" variant="tertiary">Tertiary</Button>
          <Button surface="dark" variant="outline">Outline</Button>
        </div>
      </section>

      <section>
        <Heading as="h2" size="display-2">Inputs</Heading>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input placeholder="Light input" />
          <div className="p-4 rounded-xl bg-stone-900">
            <Input surface="dark" placeholder="Dark input" />
          </div>
        </div>
      </section>

      <section>
        <Heading as="h2" size="display-2">Cards</Heading>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card variant="light"><div className="font-medium mb-2">Light</div>Card content</Card>
          <Card variant="surface"><div className="font-medium mb-2">Surface (Yellow)</div>Card content</Card>
          <Card variant="dark"><div className="font-medium mb-2">Dark</div>Card content</Card>
        </div>
      </section>

      <section>
        <Heading as="h2" size="display-2">App Outline Buttons</Heading>
        <div className="flex flex-wrap items-center gap-3">
          <button className="inline-flex items-center gap-2 rounded-lg font-heading font-black uppercase text-[18px] px-3 py-1 border-2 border-black text-black">View Recipe<span className="material-symbols-rounded text-base">arrow_forward</span></button>
          <button className="inline-flex items-center gap-1 text-black border-2 border-black rounded px-2 py-1 text-sm"><span className="material-symbols-rounded text-base text-black">close</span>Remove</button>
          <button className="text-sm px-3 py-1 rounded border-2 border-black bg-white">Set as Current</button>
          <button className="text-red-700 text-sm px-3 py-1 rounded border-2 border-red-600 bg-white">Delete</button>
        </div>
      </section>

      <section>
        <Heading as="h2" size="display-2">Filter Accordion</Heading>
        <div className="max-w-xl">
          <button className="w-full flex items-center justify-between p-3 bg-white rounded-lg text-sm font-bold text-black mb-2 border-2 border-black font-tag">
            <span>Filter by Tags (demo)</span>
            <span className="material-symbols-rounded text-[20px]">expand_more</span>
          </button>
          <div className="space-y-3 p-4 border-2 border-black rounded-lg bg-white">
            <h4 className="text-sm font-bold text-black flex items-center gap-2 font-tag">
              <span className="w-3 h-3 rounded-full bg-green-300" />Cuisine (3)
            </h4>
            <div className="flex flex-wrap gap-2 ml-5">
              <button className="px-3 py-1 rounded-full text-sm border transition-colors bg-gray-50 text-black border-gray-200">Italian</button>
              <button className="px-3 py-1 rounded-full text-sm border transition-colors bg-gray-50 text-black border-gray-200">Mexican</button>
            </div>
          </div>
        </div>
      </section>

      <section>
        <Heading as="h2" size="display-2">Tag Scroller</Heading>
        <Card variant="surface">
          <CategorizedTags recipe={{ cuisine_tags:['italian','thai','japanese'], ingredient_tags:['chicken','rice','onion','garlic','pepper'], convenience_tags:['quick','family'] }} />
        </Card>
      </section>

      <section>
        <Heading as="h2" size="display-2">Recipe Card (expand control)</Heading>
        <div className="max-w-xl">
          <RecipeCard recipe={demoRecipe} />
        </div>
      </section>

      <section>
        <Heading as="h2" size="display-2">Shopping List Controls</Heading>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="inline-flex items-center rounded-full border-2 border-black overflow-hidden">
            <button type="button" className="px-3 py-1 text-xs font-medium bg-black text-white">By recipe</button>
            <button type="button" className="px-3 py-1 text-xs font-medium border-l-2 border-black bg-white text-black">By item</button>
          </div>
          <label className="flex items-center text-sm"><input type="checkbox" className="mr-1 scale-75" />Hide pantry</label>
          <button className="ml-auto px-3 py-1 text-sm rounded-md font-medium border-2 border-black bg-white text-black">Copy</button>
        </div>
      </section>

      <section>
        <Heading as="h2" size="display-2">Components on Yellow Card</Heading>
        <Card variant="light">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="outline">Outline</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input placeholder="Your name" />
              <Input placeholder="Email" />
            </div>
            <div className="flex items-center gap-4">
              <Toggle checked={on} onChange={setOn} label="Enable" />
              <Tabs tabs={["Option A", "Option B"]} />
            </div>
          </div>
        </Card>
      </section>

      <section>
        <Heading as="h2" size="display-2">Toggle</Heading>
        <div className="flex items-center gap-6">
          <Toggle checked={on} onChange={setOn} label="Light" />
          <div className="p-3 rounded-lg bg-stone-900">
            <Toggle surface="dark" checked={on} onChange={setOn} label="Dark" />
          </div>
        </div>
      </section>

      <section>
        <Heading as="h2" size="display-2">Tabs</Heading>
        <div className="flex items-center gap-6">
          <Tabs tabs={["Meals","Shopping"]} />
          <div className="p-3 rounded-lg bg-stone-900">
            <Tabs surface="dark" tabs={["Meals","Shopping"]} />
          </div>
        </div>
      </section>
    </div>
  )
}


