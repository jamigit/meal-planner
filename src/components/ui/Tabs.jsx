import React, { useState } from 'react'

export default function Tabs({ tabs = [], initial = 0, onChange, surface = 'light' }) {
  const [active, setActive] = useState(initial)
  const base = 'inline-flex p-1 rounded-lg'
  const container = surface === 'dark' ? 'bg-white/10' : 'bg-stone-200'
  const btnBase = 'px-3 py-1.5 rounded-md text-sm font-medium transition-colors'
  const inactive = surface === 'dark' ? 'text-white/70 hover:text-white' : 'text-stone-700 hover:text-stone-900'
  const activeCls = surface === 'dark' ? 'bg-white text-stone-900' : 'bg-stone-900 text-white'

  const setIdx = (idx) => {
    setActive(idx)
    onChange && onChange(idx)
  }

  return (
    <div className={`${base} ${container}`}>
      {tabs.map((t, idx) => (
        <button key={t} className={`${btnBase} ${idx === active ? activeCls : inactive}`} onClick={() => setIdx(idx)}>
          {t}
        </button>
      ))}
    </div>
  )
}


