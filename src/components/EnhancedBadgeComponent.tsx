'use client'

import { useEffect, useState } from 'react'
import type { TicketType } from '@/types/tickettailor'
import type { Template, BadgeField } from '@/types/config'
import { getFontStack, loadGoogleFont } from '@/lib/googleFonts'
import { getProxiedImageUrl, convertImageToDataUrl } from '@/lib/imageProxy'
import QRCodeBadge from './QRCodeBadge'
import clientLogger from '@/lib/clientLogger'

interface BadgeData {
  fields: Array<{ label: string; value: string; fieldConfig?: BadgeField }>
  ticketType: TicketType
  eventName: string
  rawTicket?: any // Include raw ticket data for QR code logic
}

interface EnhancedBadgeComponentProps {
  badgeData: BadgeData
  template: Template
  fieldConfigurations?: BadgeField[]
  isBack?: boolean
}

// Helper function to find email from various sources
function findEmailAddress(fields: Array<{ label: string; value: string }>, rawTicket?: any): string | undefined {
  // First, try to find email in selected fields
  const fieldEmail = fields.find(f => 
    f.label.toLowerCase().includes('email') && 
    f.value && 
    f.value.includes('@')
  )?.value
  
  if (fieldEmail) return fieldEmail
  
  // If no field email, try to find in raw ticket data
  if (rawTicket) {
    // Check common email fields
    const emailFields = ['email', 'holder_email', 'purchaser_email', 'contact_email', 'order_email']
    for (const field of emailFields) {
      if (rawTicket[field] && rawTicket[field].includes('@')) {
        return rawTicket[field]
      }
    }
    
    // Check custom fields for email
    if (rawTicket.custom_fields) {
      for (const [key, value] of Object.entries(rawTicket.custom_fields)) {
        if (typeof value === 'string' && value.includes('@')) {
          return value
        }
      }
    }
  }
  
  return undefined
}

export default function EnhancedBadgeComponent({ badgeData, template, fieldConfigurations, isBack = false }: EnhancedBadgeComponentProps) {
  const { fields, ticketType, eventName, rawTicket } = badgeData
  
  // Debug logging - only log once per component instance
  const [hasLogged, setHasLogged] = useState(false)
  
  useEffect(() => {
    if (!hasLogged) {
      clientLogger.log('BADGE_COMPONENT', {
        render: {
          isBack,
          eventName,
          ticketType: ticketType?.name,
          fields: fields.map(f => ({ label: f.label, value: f.value })),
          template: {
            id: template.id,
            name: template.name,
            backgroundImage: template.backgroundImage,
            nameFontSize: template.nameFontSize
          }
        }
      })
      setHasLogged(true)
    }
  }, [hasLogged, isBack, eventName, ticketType, fields, template])
  
  const [backgroundImage, setBackgroundImage] = useState<string | undefined>(template.backgroundImage)
  const [backgroundLoaded, setBackgroundLoaded] = useState(false)
  const [fontsLoaded, setFontsLoaded] = useState(false)
  
  // Set background image simply
  useEffect(() => {
    if (template.backgroundImage) {
      setBackgroundImage(template.backgroundImage)
      setBackgroundLoaded(true)
    } else {
      setBackgroundImage(undefined)
      setBackgroundLoaded(true)
    }
  }, [template.backgroundImage])

  // Use background image normally
  const testWithoutBackground = false // Set back to false to use background images

  // Load fonts simply
  useEffect(() => {
    if (fieldConfigurations) {
      fieldConfigurations.forEach(config => {
        loadGoogleFont(config.fontStyle.fontFamily, [config.fontStyle.fontWeight, '400', '700'])
      })
    }
    setFontsLoaded(true)
  }, [fieldConfigurations])

  // Find field configuration by field key
  const getFieldConfig = (field: { label: string; value: string }) => {
    return fieldConfigurations?.find(config => 
      config.field === field.label.toLowerCase().replace(/\s+/g, '_') ||
      config.label === field.label
    )
  }
  
  // Find the main name field (usually holder_name)
  const nameField = fields.find(f => 
    f.label.toLowerCase().includes('holder') && f.label.toLowerCase().includes('name') ||
    f.label.toLowerCase() === 'holder name' ||
    f.label.toLowerCase().includes('name') && !f.label.toLowerCase().includes('event')
  )
  const otherFields = fields.filter(f => f !== nameField && f.value.trim() !== '')
  
  // Debug: Log name field info
  if (!hasLogged && nameField) {
    console.log(`Badge ${isBack ? 'BACK' : 'FRONT'}: nameField = ${nameField.label}: "${nameField.value}"`)
  }
  
  // Debug field processing - only log once
  useEffect(() => {
    if (!hasLogged) {
      clientLogger.log('BADGE_COMPONENT', {
        fieldProcessing: {
          totalFields: fields.length,
          nameField: nameField ? { label: nameField.label, value: nameField.value } : null,
          otherFields: otherFields.map(f => ({ label: f.label, value: f.value })),
          allFields: fields.map(f => ({ label: f.label, value: f.value, trimmed: f.value.trim() }))
        }
      })
    }
  }, [hasLogged, fields, nameField, otherFields])

  // Calculate full size including bleed for proper full-bleed backgrounds
  const bleed = template.bleed || 0
  const fullWidth = template.pageSize.width + (bleed * 2)
  const fullHeight = template.pageSize.height + (bleed * 2)
  
  const badgeStyle = {
    width: `${fullWidth}mm`,
    height: `${fullHeight}mm`,
    backgroundColor: template.backgroundColor || '#ffffff',
    border: '1px solid #e5e7eb', // Light border for screen display only
    padding: `${bleed}mm`,
    boxSizing: 'border-box' as const,
    position: 'relative' as const,
    overflow: 'hidden',
    isolation: 'isolate' as const
  }

  const contentStyle = {
    width: template.pageSize.cssWidth,
    height: template.pageSize.cssHeight,
    display: 'flex',
    flexDirection: 'column' as const,
    position: 'relative' as const,
    margin: '0 auto' // Center the content area within the full bleed area
  }

  // Remove complex loading logic - just render immediately

  return (
    <div className="badge print:break-after-always print:break-inside-avoid" style={badgeStyle}>
      {/* Background image as img element for better html2canvas compatibility */}
      {backgroundImage && !testWithoutBackground && (
        <img 
          src={backgroundImage}
          alt=""
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            zIndex: 0
          }}
        />
      )}
      <div style={{ ...contentStyle, position: 'relative', zIndex: 1 }}>
        {/* Header with event name */}
        {template.showEventName !== false && (
          <div className="text-center py-2 text-xs text-gray-600 font-medium">
            {eventName}
          </div>
        )}

        {/* Main content area with 10mm side margins */}
        <div 
          className="flex-1 flex flex-col items-center justify-center"
          style={{ 
            paddingLeft: '10mm',
            paddingRight: '10mm',
            paddingTop: '16mm',
            paddingBottom: '4mm'
          }}
        >
          {/* Main name - largest text */}
          {nameField && (
            <div className="text-center mb-4 w-full">
              {(() => {
                const config = getFieldConfig(nameField)
                const style = config ? {
                  fontFamily: getFontStack(config.fontStyle.fontFamily),
                  fontSize: `${config.fontStyle.fontSize}px`,
                  fontWeight: config.fontStyle.fontWeight,
                  color: config.fontStyle.color || template.nameColor || '#111827',
                  textAlign: config.fontStyle.textAlign || 'center',
                  lineHeight: config.fontStyle.lineHeight || 1.2,
                  wordWrap: 'break-word' as 'break-word',
                  overflowWrap: 'break-word' as 'break-word',
                  hyphens: 'auto' as 'auto'
                } : {}
                

                
                return (
                  <h1 
                    className="leading-tight w-full"
                    style={config ? style : { 
                      fontSize: `${template.nameFontSize || 24}px`, 
                      fontWeight: '700', 
                      color: template.nameColor || '#111827',
                      lineHeight: '1.2',
                      wordWrap: 'break-word' as 'break-word',
                      overflowWrap: 'break-word' as 'break-word',
                      hyphens: 'auto' as 'auto'
                    }}
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
                    {field.value}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer with ticket type */}
        <div 
          className="text-white font-semibold"
          style={{ 
            backgroundColor: ticketType.colour,
            marginLeft: `-${template.bleed}mm`,
            marginRight: `-${template.bleed}mm`,
            marginBottom: `-${template.bleed}mm`,
            height: '12mm',
            textAlign: 'center',
            fontSize: '14px',
            paddingTop: '1mm',
            paddingBottom: '0.1mm',  // Add padding bottom to push text up visually
            boxSizing: 'border-box' as const
          }}
        >
          {ticketType.name}
        </div>
      </div>
      
      {/* QR Code overlay */}
      {template.qrCode && (
        (isBack && template.qrCode.showOnBack) || 
        (!isBack && template.qrCode.showOnFront)
      ) && (() => {
        const name = nameField?.value || ''
        const email = findEmailAddress(fields, rawTicket)
        const jobTitle = fields.find(f => f.label.toLowerCase().includes('job') || f.label.toLowerCase().includes('title'))?.value
        const company = fields.find(f => f.label.toLowerCase().includes('company') || f.label.toLowerCase().includes('organisation'))?.value
        

        
        return (
          <QRCodeBadge
            name={name}
            email={email}
            jobTitle={jobTitle}
            company={company}
            settings={template.qrCode}
            containerWidth={template.pageSize.width}
            containerHeight={template.pageSize.height}
          />
        )
      })()}
    </div>
  )
}