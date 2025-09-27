import React from 'react'
import { joinClasses, baseClasses } from '../../utils/designSystem'

export default function Input({ surface = 'light', className, ...props }) {
  const baseClass = baseClasses.input
  
  const surfaceClasses = {
    light: 'bg-white text-text-primary border-border-secondary focus:ring-text-primary placeholder:text-text-tertiary',
    dark: 'bg-surface-dark/60 text-text-onDark border-text-onDark/30 focus:ring-text-onDark placeholder:text-text-onDark/60'
  }
  
  const surfaceClass = surfaceClasses[surface] || surfaceClasses.light
  
  return (
    <input 
      className={joinClasses(baseClass, surfaceClass, className)} 
      {...props} 
    />
  )
}


