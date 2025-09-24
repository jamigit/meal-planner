import React, { useState } from 'react'
import Heading from './ui/Heading'
import Button from './ui/Button'
import Card from './ui/Card'
import Input from './ui/Input'
import Toggle from './ui/Toggle'
import Tabs from './ui/Tabs'

export default function Styleguide() {
  const [on, setOn] = useState(false)
  return (
    <div className="space-y-8">
      <Heading as="h1" size="display-1">Styleguide</Heading>

      <section>
        <Heading as="h2" size="display-2">Buttons (light)</Heading>
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="outline">Outline</Button>
        </div>
      </section>

      <section className="p-4 rounded-xl bg-stone-900 text-white">
        <Heading as="h2" size="display-2">Buttons (dark surface)</Heading>
        <div className="flex flex-wrap items-center gap-3">
          <Button surface="dark">Primary</Button>
          <Button surface="dark" variant="secondary">Secondary</Button>
          <Button surface="dark" variant="ghost">Ghost</Button>
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
          <Card variant="light">Light Card content</Card>
          <Card variant="surface">Surface Card content</Card>
          <Card variant="dark">Dark Card content</Card>
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


