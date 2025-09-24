import React from 'react'

function joinClasses(...classes) { return classes.filter(Boolean).join(' ') }

export default function Input({ surface = 'light', className, ...props }) {
  const base = 'block w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 placeholder:text-stone-400'
  const onLight = 'bg-white text-stone-900 border-2 border-stone-300 focus:ring-stone-800'
  const onDark = 'bg-stone-800/60 text-white border-2 border-white/30 placeholder:text-white/60 focus:ring-white'
  const palette = surface === 'dark' ? onDark : onLight
  return <input className={joinClasses(base, palette, className)} {...props} />
}


