'use client'

import { useEffect, useState } from 'react'
import type { TicketType } from '@/types/tickettailor'
import type { Template, BadgeField } from '@/types/config'
import { getFontStack, loadGoogleFont } from '@/lib/googleFonts'

interface BadgeData {
  fields: Array<{ label: string; value: string; fieldConfig?: BadgeField }>
  ticketType: TicketType
  eventName: string
}

interface EnhancedBadgeComponentProps {
  badgeData: BadgeData
  template: Template
  fieldConfigurations?: BadgeField[]
}

export default function EnhancedBadgeComponent({ badgeData, template, fieldConfigurations }: EnhancedBadgeComponentProps) {
  const { fields, ticketType, eventName } = badgeData
  const [backgroundImage, setBackgroundImage] = useState<string | undefined>(template.backgroundImage)
  
  // Set background image
  useEffect(() => {
    setBackgroundImage(template.backgroundImage)
  }, [template.backgroundImage])

  // Load fonts for all field configurations
  useEffect(() => {
    if (fieldConfigurations) {
      fieldConfigurations.forEach(config => {
        loadGoogleFont(config.fontStyle.fontFamily, [config.fontStyle.fontWeight, '400', '700'])
      })
    }
  }, [fieldConfigurations])

  // Find field configuration by field key
  const getFieldConfig = (field: { label: string; value: string }) => {
    return fieldConfigurations?.find(config => 
      config.field === field.label.toLowerCase().replace(/\s+/g, '_') ||
      config.label === field.label
    )
  }
  
  // Find the main name field (usually holder_name)
  const nameField = fields.find(f => f.label.toLowerCase().includes('name') || f.label.toLowerCase() === 'holder name')
  const otherFields = fields.filter(f => f !== nameField && f.value.trim() !== '')

  const badgeStyle = {
    width: template.pageSize.cssWidth,
    height: template.pageSize.cssHeight,
    backgroundColor: template.backgroundColor || '#ffffff',
    backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
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
              {(() => {
                const config = getFieldConfig(nameField)
                const style = config ? {
                  fontFamily: getFontStack(config.fontStyle.fontFamily),
                  fontSize: `${config.fontStyle.fontSize}px`,
                  fontWeight: config.fontStyle.fontWeight,
                  color: config.fontStyle.color,
                  textAlign: config.fontStyle.textAlign || 'center',
                  lineHeight: config.fontStyle.lineHeight || 1.2
                } : {}
                
                return (
                  <h1 
                    className="leading-tight"
                    style={config ? style : { fontSize: '24px', fontWeight: '700', color: '#111827' }}
                  >
                    {nameField.value}
                  </h1>
                )
              })()}
            </div>
          )}

          {/* Additional fields */}
          {otherFields.length > 0 && (
            <div className="text-center space-y-2">
              {otherFields.slice(0, 3).map((field, index) => {
                const config = getFieldConfig(field)
                const style = config ? {
                  fontFamily: getFontStack(config.fontStyle.fontFamily),
                  fontSize: `${config.fontStyle.fontSize}px`,
                  fontWeight: config.fontStyle.fontWeight,
                  color: config.fontStyle.color,
                  textAlign: config.fontStyle.textAlign || 'center',
                  lineHeight: config.fontStyle.lineHeight || 1.4
                } : { fontSize: '14px', color: '#374151' }

                return (
                  <div key={index} style={style}>
                    <span className="font-medium">{field.label}:</span>{' '}
                    <span>{field.value}</span>
                  </div>
                )
              })}
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