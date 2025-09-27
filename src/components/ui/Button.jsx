import React from 'react'
import { 
  joinClasses, 
  baseClasses, 
  buttonVariants, 
  typography, 
  spacing 
} from '../../utils/designSystem'

export default function Button({
  variant = 'primary',
  size = 'md',
  surface = 'light',
  className,
  ...props
}) {
  // Use design system base classes and typography
  const baseClass = baseClasses.button
  const typographyClass = typography.button[size] || typography.button.md
  const spacingClass = spacing.button[size] || spacing.button.md
  const variantClass = buttonVariants[variant]?.[surface] || buttonVariants.primary[surface]

  return (
    <button
      className={joinClasses(
        baseClass,
        typographyClass,
        spacingClass,
        variantClass,
        className
      )}
      {...props}
    />
  )
}


