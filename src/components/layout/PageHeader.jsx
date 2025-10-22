import React from 'react'

/**
 * Reusable page header component with optional hero image
 * Provides consistent page titles and action buttons
 */
export default function PageHeader({ 
  title, 
  subtitle,
  actions,
  showHeroImage = false,
  className = '' 
}) {
  return (
    <>
      {showHeroImage && (
        <img
          src="/images/kiwi-hero.png"
          alt="Kiwi hero"
          className="pointer-events-none select-none absolute -top-28 max-[500px]:-top-20 md:-top-40 right-4 max-[500px]:right-2 md:-right-10 w-60 max-[500px]:w-48 h-60 max-[500px]:h-48 md:w-80 md:h-80 object-contain transform -scale-x-100 z-[-1]"
        />
      )}
      <div className={`mt-16 mb-10 relative z-10 ${className}`}>
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <h1 className="font-heading text-display-2 uppercase text-black">
              {title}
            </h1>
            {subtitle && (
              <p className="text-black mt-2">{subtitle}</p>
            )}
          </div>
          {actions && (
            <div className="flex gap-3 flex-wrap justify-end">
              {actions}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
