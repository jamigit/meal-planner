import React from 'react'

export default function Toggle({ checked, onChange, surface = 'light', label }) {
  const base = 'relative inline-flex h-6 w-11 items-center rounded-full transition-colors'
  const bgOff = surface === 'dark' ? 'bg-white/20' : 'bg-stone-300'
  const bgOn = surface === 'dark' ? 'bg-yellow-400' : 'bg-stone-800'
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`${base} ${checked ? bgOn : bgOff}`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : 'translate-x-1'}`}
      />
      {label && <span className="ml-3 text-sm">{label}</span>}
    </button>
  )
}


