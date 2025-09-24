import React from 'react'

function joinClasses(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function Card({ variant = 'light', className, children }) {
  const variants = {
    light: 'bg-brand-primary text-stone-900 shadow-card rounded-lg',
    surface: 'bg-brand-surface text-stone-900 shadow-card rounded-lg',
    dark: 'bg-stone-900 text-white rounded-lg border-2 border-stone-700'
  }

  return (
    <div className={joinClasses('p-6', variants[variant], className)}>
      {children}
    </div>
  )
}


