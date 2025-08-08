'use client'

import { useState, useEffect } from 'react'
import type { Event, TicketType } from '@/types/tickettailor'
import type { Template, EventConfiguration } from '@/types/config'
import EventSelector from './EventSelector'
import EnhancedBadgeComponent from './EnhancedBadgeComponent'
import FlippableBadge from './FlippableBadge'
import { generateBadgesPDF } from '@/lib/pdfGenerator'
import '../styles/badge-flip.css'

interface BlankBadgeGeneratorProps {
  onBack?: () => void
}

export default function BlankBadgeGenerator({ onBack }: BlankBadgeGeneratorProps) {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [eventConfig, setEventConfig] = useState<EventConfiguration | null>(null)
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sortAlphabetically, setSortAlphabetically] = useState(false)

  useEffect(() => {
    fetchTemplates()
  }, [])

  useEffect(() => {
    if (selectedEvent) {
      fetchEventConfig()
    }
  }, [selectedEvent])

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data)
        if (data.length > 0 && !selectedTemplate) {
          setSelectedTemplate(data[0])
        }
      }
    } catch (err) {
      console.error('Error fetching templates:', err)
    }
  }

  const fetchEventConfig = async () => {
    if (!selectedEvent) return
    
    try {
      const response = await fetch(`/api/event-config?eventId=${selectedEvent.id}`)
      if (response.ok) {
        const config = await response.json()
        setEventConfig(config)
      }
    } catch (err) {
      console.error('Error fetching event config:', err)
    }
  }

  const handleEventSelect = (event: Event, types: TicketType[]) => {
    setSelectedEvent(event)
    setTicketTypes(types)
    
    // Initialize quantities to 0 for all ticket types
    const initialQuantities: Record<string, number> = {}
    types.forEach(type => {
      initialQuantities[type.id] = 0
    })
    setQuantities(initialQuantities)
  }

  const handleQuantityChange = (ticketTypeId: string, quantity: number) => {
    setQuantities(prev => ({
      ...prev,
      [ticketTypeId]: Math.max(0, quantity)
    }))
  }

  const getTotalQuantity = () => {
    return Object.values(quantities).reduce((sum, qty) => sum + qty, 0)
  }

  const generateBlankBadges = () => {
    if (!selectedEvent || !selectedTemplate) return []

    const badges: any[] = []
    
    // Get sorted ticket types if alphabetical sort is enabled
    const sortedTicketTypes = sortAlphabetically
      ? [...ticketTypes].sort((a, b) => {
          const nameA = (eventConfig?.ticketTypeNames?.[a.id] || a.name).toLowerCase()
          const nameB = (eventConfig?.ticketTypeNames?.[b.id] || b.name).toLowerCase()
          return nameA.localeCompare(nameB)
        })
      : ticketTypes
    
    sortedTicketTypes.forEach(ticketType => {
      const quantity = quantities[ticketType.id] || 0
      const customName = eventConfig?.ticketTypeNames?.[ticketType.id] || ticketType.name
      const customColor = eventConfig?.ticketTypeColors?.[ticketType.id] || ticketType.colour

      for (let i = 0; i < quantity; i++) {
        badges.push({
          key: `${ticketType.id}-${i}`,
          badgeData: {
            fields: [
              { label: 'Holder Name', value: '________________' }, // Blank line for writing
            ],
            ticketType: {
              ...ticketType,
              name: customName,
              colour: customColor
            },
            eventName: selectedEvent.name
          }
        })
      }
    })

    return badges
  }

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [pdfProgress, setPdfProgress] = useState({ current: 0, total: 0, percentage: 0 })
  
  const handleGeneratePDF = async () => {
    if (getTotalQuantity() === 0) {
      alert('Please set quantities for at least one ticket type')
      return
    }
    
    if (!selectedTemplate) {
      alert('Please select a template')
      return
    }
    
    try {
      setIsGeneratingPDF(true)
      setPdfProgress({ current: 0, total: 0, percentage: 0 })
      
      // Get all badge front elements
      const badgeFronts = document.querySelectorAll('.badge-front .badge') as NodeListOf<HTMLElement>
      // Get all badge back elements  
      const badgeBacks = document.querySelectorAll('.badge-back .badge') as NodeListOf<HTMLElement>
      
      if (badgeFronts.length === 0) {
        alert('No badge elements found to generate PDF')
        return
      }
      
      // Prepare badge data - interleave fronts and backs for double-sided printing
      const badgeData: Array<{element: HTMLElement, template: Template}> = []
      
      for (let i = 0; i < badgeFronts.length; i++) {
        // Add front
        badgeData.push({
          element: badgeFronts[i],
          template: selectedTemplate
        })
        // Add back
        if (badgeBacks[i]) {
          badgeData.push({
            element: badgeBacks[i],
            template: selectedTemplate
          })
        }
      }
      
      // Generate filename with event name and date
      const eventName = selectedEvent?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'blank_badges'
      const date = new Date().toISOString().split('T')[0]
      const filename = `${eventName}_blank_badges_double_sided_${date}.pdf`
      
      // Generate PDF with progress tracking
      await generateBadgesPDF(badgeData, filename, (percentage, current, total) => {
        setPdfProgress({ current, total, percentage })
      })
      
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate PDF. Please try again.')
    } finally {
      setIsGeneratingPDF(false)
      setPdfProgress({ current: 0, total: 0, percentage: 0 })
    }
  }

  const blankBadges = generateBlankBadges()

  if (!selectedEvent) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Blank Badge Generator</h1>
          <p className="mt-1 text-sm text-gray-500">
            Generate blank badges for walk-ins and manual registration
          </p>
        </div>
        
        <EventSelector onEventSelect={handleEventSelect} />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="no-print">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Blank Badge Generator</h1>
            <p className="mt-1 text-sm text-gray-500">
              Generate blank badges for {selectedEvent.name}
            </p>
          </div>
          <button
            onClick={() => setSelectedEvent(null)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Change Event
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-6">
          {/* Template Selection */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Template</h3>
            <select
              value={selectedTemplate?.id || ''}
              onChange={(e) => {
                const template = templates.find(t => t.id === e.target.value)
                setSelectedTemplate(template || null)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select template</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name} ({template.pageSize.name})
                </option>
              ))}
            </select>
          </div>

          {/* Quantities */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Quantities</h3>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {ticketTypes.map((ticketType) => {
                const displayName = eventConfig?.ticketTypeNames?.[ticketType.id] || ticketType.name
                const displayColor = eventConfig?.ticketTypeColors?.[ticketType.id] || ticketType.colour
                
                return (
                  <div key={ticketType.id} className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: displayColor }}
                    />
                    <label className="flex-1 text-sm font-medium text-gray-900 truncate">
                      {displayName}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="999"
                      value={quantities[ticketType.id] || 0}
                      onChange={(e) => handleQuantityChange(ticketType.id, parseInt(e.target.value) || 0)}
                      className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )
              })}
            </div>
          </div>

          {/* Print */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Print</h3>
            <div className="space-y-3">
              <div className="text-sm text-gray-600">
                Total: {getTotalQuantity()} blank badge(s)
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="sort-alphabetically-blank"
                  checked={sortAlphabetically}
                  onChange={(e) => setSortAlphabetically(e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="sort-alphabetically-blank" className="text-sm text-gray-700">
                  Sort A-Z by ticket type
                </label>
              </div>
              
              <button
                onClick={handleGeneratePDF}
                disabled={!selectedTemplate || getTotalQuantity() === 0 || isGeneratingPDF}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingPDF ? (
                  pdfProgress.total > 0 ? 
                    `Generating PDF... ${pdfProgress.percentage}% (${pdfProgress.current}/${pdfProgress.total})` 
                    : 'Generating PDF...'
                ) : 'Download PDF'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Badge Preview/Print Area */}
      {selectedTemplate && blankBadges.length > 0 && (
        <div className="badge-grid">
          {blankBadges.map((badge) => (
            <FlippableBadge
              key={badge.key}
              frontContent={
                <EnhancedBadgeComponent
                  badgeData={badge.badgeData}
                  template={selectedTemplate}
                  fieldConfigurations={eventConfig?.badgeFields}
                  isBack={false}
                />
              }
              backContent={
                <EnhancedBadgeComponent
                  badgeData={badge.badgeData}
                  template={selectedTemplate}
                  fieldConfigurations={eventConfig?.badgeFields}
                  isBack={true}
                />
              }
              template={selectedTemplate}
              eventName={selectedEvent?.name || ''}
              ticketTypeName={badge.badgeData.ticketType.name}
              ticketTypeColor={badge.badgeData.ticketType.colour}
            />
          ))}
        </div>
      )}

      {selectedTemplate && getTotalQuantity() === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>Set quantities above to preview blank badges</p>
        </div>
      )}

      {!selectedTemplate && (
        <div className="text-center py-12 text-gray-500">
          <p>Select a template to preview blank badges</p>
        </div>
      )}
    </div>
  )
}