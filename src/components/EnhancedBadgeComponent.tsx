'use client'

import type { TicketType } from '@/types/tickettailor'
import type { Template } from '@/types/config'

interface BadgeData {
  fields: Array<{ label: string; value: string }>
  ticketType: TicketType
  eventName: string
}

interface EnhancedBadgeComponentProps {
  badgeData: BadgeData
  template: Template
}

export default function EnhancedBadgeComponent({ badgeData, template }: EnhancedBadgeComponentProps) {
  const { fields, ticketType, eventName } = badgeData
  
  // Find the main name field (usually holder_name)
  const nameField = fields.find(f => f.label.toLowerCase().includes('name') || f.label.toLowerCase() === 'holder name')
  const otherFields = fields.filter(f => f !== nameField && f.value.trim() !== '')

  const badgeStyle = {
    width: template.pageSize.cssWidth,
    height: template.pageSize.cssHeight,
    backgroundColor: template.backgroundColor || '#ffffff',
    backgroundImage: template.backgroundImage ? `url(${template.backgroundImage})` : undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    border: '1px solid #000',
    padding: `${template.bleed}mm`
  }

  const contentStyle = {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    position: 'relative' as const
  }

  return (
    <div className="badge print:break-after-always print:break-inside-avoid" style={badgeStyle}>
      <div style={contentStyle}>
        {/* Header with event name */}
        <div className="text-center py-2 text-xs text-gray-600 font-medium">
          {eventName}
        </div>

        {/* Main content area */}
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          {/* Main name - largest text */}
          {nameField && (
            <div className="text-center mb-4">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                {nameField.value}
              </h1>
            </div>
          )}

          {/* Additional fields */}
          {otherFields.length > 0 && (
            <div className="text-center space-y-1 text-sm text-gray-700">
              {otherFields.slice(0, 3).map((field, index) => (
                <div key={index}>
                  <span className="font-medium">{field.label}:</span>{' '}
                  <span>{field.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with ticket type */}
        <div 
          className="h-12 flex items-center justify-center text-white font-semibold"
          style={{ 
            backgroundColor: ticketType.colour,
            marginLeft: `-${template.bleed}mm`,
            marginRight: `-${template.bleed}mm`,
            marginBottom: `-${template.bleed}mm`
          }}
        >
          {ticketType.name}
        </div>
      </div>
    </div>
  )
}