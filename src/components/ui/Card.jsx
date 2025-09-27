import React from 'react'
import { 
  joinClasses, 
  baseClasses, 
  cardVariants 
} from '../../utils/designSystem'

export default function Card({ variant = 'light', className, children }) {
  const baseClass = baseClasses.card
  const variantClass = cardVariants[variant] || cardVariants.light

  return (
    <div className={joinClasses(baseClass, variantClass, className)}>
      {children}
    </div>
  )
}


