/**
 * @fileoverview Test for skip link accessibility functionality
 */

import React from 'react'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SkipLink } from '../AccessibilityComponents.jsx'

describe('SkipLink Component', () => {
  beforeEach(() => {
    // Set up a mock main content element
    document.body.innerHTML = '<div id="main-content">Main Content</div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should render skip link with default props', () => {
    render(<SkipLink />)
    
    const skipLink = screen.getByRole('link', { name: 'Skip to main content' })
    expect(skipLink).toBeInTheDocument()
    expect(skipLink).toHaveAttribute('href', '#main-content')
    expect(skipLink).toHaveClass('skip-link')
  })

  it('should render skip link with custom props', () => {
    render(
      <SkipLink 
        href="#custom-content" 
        className="custom-class"
      >
        Skip to custom content
      </SkipLink>
    )
    
    const skipLink = screen.getByRole('link', { name: 'Skip to custom content' })
    expect(skipLink).toBeInTheDocument()
    expect(skipLink).toHaveAttribute('href', '#custom-content')
    expect(skipLink).toHaveClass('skip-link', 'custom-class')
  })

  it('should have skip-link CSS class for proper styling', () => {
    render(<SkipLink />)
    
    const skipLink = screen.getByRole('link', { name: 'Skip to main content' })
    
    // Should have the skip-link class for CSS styling
    expect(skipLink).toHaveClass('skip-link')
  })

  it('should have proper accessibility attributes', () => {
    render(<SkipLink />)
    
    const skipLink = screen.getByRole('link', { name: 'Skip to main content' })
    expect(skipLink).toHaveAttribute('href', '#main-content')
    expect(skipLink).toHaveTextContent('Skip to main content')
  })
})
