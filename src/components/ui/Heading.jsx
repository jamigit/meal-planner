import React from 'react'
import { joinClasses, typography } from '../../utils/designSystem'

const headingSizes = {
  'display-1': typography.display[1],
  'display-2': typography.display[2],
  'display-3': typography.display[3],
  'heading-xl': typography.heading.xl,
  'heading-lg': typography.heading.lg,
  'heading-md': typography.heading.md,
  'heading-sm': typography.heading.sm,
  // Backward compatibility
  'h1': typography.display[1],
  'h2': typography.display[2],
  'h3': typography.heading.xl,
  'h4': typography.heading.lg
}

export default function Heading({ as = 'h2', size = 'display-2', uppercase = true, className, children }) {
  const Component = as
  const base = 'tracking-tight'
  const sizeClass = headingSizes[size] || typography.heading.lg
  const transform = uppercase ? 'uppercase' : ''
  
  return (
    <Component className={joinClasses(base, sizeClass, transform, className)}>
      {children}
    </Component>
  )
}


