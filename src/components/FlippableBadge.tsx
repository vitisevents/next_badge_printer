'use client'

import { ReactNode, cloneElement, isValidElement } from 'react'
import type { Template } from '@/types/config'

interface FlippableBadgeProps {
  frontContent: ReactNode
  backContent?: ReactNode
  template: Template
  eventName: string
  ticketTypeName: string
  ticketTypeColor: string
}

export default function FlippableBadge({ 
  frontContent,
  backContent, 
  template, 
  eventName, 
  ticketTypeName,
  ticketTypeColor 
}: FlippableBadgeProps) {
  // Calculate full size including bleed
  const bleed = template.bleed || 0
  const fullWidth = template.pageSize.width + (bleed * 2)
  const fullHeight = template.pageSize.height + (bleed * 2)
  
  const containerStyle = {
    width: `${fullWidth}mm`,
    height: `${fullHeight}mm`,
  }

  const backStyle = {
    width: `${fullWidth}mm`,
    height: `${fullHeight}mm`,
    backgroundColor: template.backgroundColor || '#ffffff',
    backgroundImage: template.backgroundImage ? `url(${template.backgroundImage})` : undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    border: '1px solid #e5e7eb',
    padding: `${bleed}mm`,
    boxSizing: 'border-box' as const,
    position: 'relative' as const
  }

  const contentStyle = {
    width: template.pageSize.cssWidth,
    height: template.pageSize.cssHeight,
    display: 'flex',
    flexDirection: 'column' as const,
    position: 'relative' as const,
    margin: '0 auto'
  }

  return (
    <div className="badge-flip-container" style={containerStyle}>
      <div className="badge-flip-inner">
        {/* Front of badge */}
        <div className="badge-front">
          {frontContent}
        </div>
        
        {/* Back of badge - same as front but with isBack prop */}
        <div className="badge-back">
          {backContent || frontContent}
        </div>
      </div>
    </div>
  )
}