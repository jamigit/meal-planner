import React from 'react'

const sizes = {
  'display-1': 'text-display-1',
  'display-2': 'text-display-2',
  'display-3': 'text-display-3',
  'h1': 'text-4xl md:text-5xl',
  'h2': 'text-3xl md:text-4xl',
  'h3': 'text-2xl md:text-3xl',
  'h4': 'text-xl md:text-2xl'
}

export default function Heading({ as = 'h2', size = 'display-2', uppercase = true, className, children }) {
  const Component = as
  const base = 'font-heading font-black tracking-tight'
  const transform = uppercase ? 'uppercase' : ''
  const cls = [base, sizes[size] || '', transform, className].filter(Boolean).join(' ')
  return <Component className={cls}>{children}</Component>
}


