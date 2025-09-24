import React from 'react'

function joinClasses(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function Button({
  variant = 'primary',
  size = 'md',
  surface = 'light',
  className,
  ...props
}) {
  const base = 'inline-flex items-center justify-center rounded-lg font-heading font-black uppercase text-[20px] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2'

  const sizeClasses = {
    sm: 'px-3 py-1.5',
    md: 'px-4 py-2',
    lg: 'px-5 py-3'
  }

  const onLight = {
    primary: 'bg-stone-800 text-white hover:bg-stone-900 focus:ring-stone-800',
    secondary: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-600',
    ghost: 'bg-transparent text-stone-800 hover:bg-black/5 focus:ring-stone-800',
    outline: 'bg-white text-stone-900 border-2 border-stone-900 hover:bg-stone-100 focus:ring-stone-800'
  }

  const onDark = {
    primary: 'bg-white text-stone-900 hover:bg-stone-100 focus:ring-white',
    secondary: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-600',
    ghost: 'bg-transparent text-white hover:bg-white/10 focus:ring-white',
    outline: 'bg-white text-stone-900 border-2 border-stone-900 hover:bg-stone-100 focus:ring-white'
  }

  const palette = surface === 'dark' ? onDark : onLight

  return (
    <button
      className={joinClasses(base, sizeClasses[size], palette[variant], className)}
      {...props}
    />
  )
}


