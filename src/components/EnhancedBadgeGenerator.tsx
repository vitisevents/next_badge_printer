'use client'

import { useState, useEffect } from 'react'
import type { Event, TicketType, Ticket } from '@/types/tickettailor'
import type { Template, EventConfiguration, BadgeField } from '@/types/config'
import EnhancedBadgeComponent from './EnhancedBadgeComponent'
import { generateBadgesPDF } from '@/lib/pdfGenerator'

interface EnhancedBadgeGeneratorProps {
  event: Event
  ticketTypes: TicketType[]
  onBack: () => void
}

export default function EnhancedBadgeGenerator({ event, ticketTypes, onBack }: EnhancedBadgeGeneratorProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [tickets, setTickets] = useState<any[]>([])
  const [eventConfig, setEventConfig] = useState<EventConfiguration | null>(null)
  const [selectedTicketTypes, setSelectedTicketTypes] = useState<Set<string>>(new Set())
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set(['holder_name']))
  const [availableFields, setAvailableFields] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortAlphabetically, setSortAlphabetically] = useState(false)

  useEffect(() => {
    Promise.all([
      fetchTemplates(),
      fetchTickets(),
      fetchEventConfig()
    ])
  }, [event.id])

  useEffect(() => {
    // Select all ticket types by default
    const allTypeIds = new Set(ticketTypes.map(t => t.id))
    setSelectedTicketTypes(allTypeIds)
  }, [ticketTypes])

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

  const fetchTickets = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/tickets?event_id=${event.id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch tickets')
      }
      
      const data = await response.json()
      setTickets(data)
      
      // Extract unique ticket types and select all by default
      const uniqueTicketTypes = new Set<string>()
      data.forEach((ticket: any) => {
        if (ticket.ticket_type_id) {
          uniqueTicketTypes.add(ticket.ticket_type_id)
        }
      })
      
      // Select all ticket types by default
      setSelectedTicketTypes(uniqueTicketTypes)
      
      // Extract available fields from tickets
      const fieldsSet = new Set<string>()
      data.forEach((ticket: any) => {
        // Add standard fields
        Object.keys(ticket).forEach(key => {
          if (!['custom_fields'].includes(key)) {
            fieldsSet.add(key)
          }
        })
        
        // Add custom fields
        if (ticket.custom_fields) {
          Object.keys(ticket.custom_fields).forEach(key => {
            fieldsSet.add(`custom_${key}`)
          })
        }
      })
      
      setAvailableFields(Array.from(fieldsSet).sort())
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tickets')
    } finally {
      setLoading(false)
    }
  }

  const fetchEventConfig = async () => {
    try {
      const response = await fetch(`/api/event-config?eventId=${event.id}`)
      if (response.ok) {
        const config = await response.json()
        setEventConfig(config)
      }
    } catch (err) {
      console.error('Error fetching event config:', err)
    }
  }

  const handleTicketTypeToggle = (typeId: string) => {
    const newSelected = new Set(selectedTicketTypes)
    if (newSelected.has(typeId)) {
      newSelected.delete(typeId)
    } else {
      newSelected.add(typeId)
    }
    setSelectedTicketTypes(newSelected)
  }

  const handleFieldToggle = (field: string) => {
    const newSelected = new Set(selectedFields)
    if (newSelected.has(field)) {
      if (field !== 'holder_name') { // Always keep holder_name selected
        newSelected.delete(field)
      }
    } else {
      newSelected.add(field)
    }
    setSelectedFields(newSelected)
  }

  const getFieldLabel = (field: string): string => {
    if (field.startsWith('custom_')) {
      return field.replace('custom_', '').replace(/_/g, ' ')
    }
    return field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const getFieldValue = (ticket: any, field: string): string => {
    if (field.startsWith('custom_')) {
      const customField = field.replace('custom_', '')
      return ticket.custom_fields?.[customField] || ''
    }
    return ticket[field] || ''
  }

  const filteredTickets = tickets
    .filter(ticket => selectedTicketTypes.has(ticket.ticket_type_id))
    .sort((a, b) => {
      if (!sortAlphabetically) return 0
      
      // Sort by holder name alphabetically
      const nameA = (a.holder_name || '').toLowerCase().trim()
      const nameB = (b.holder_name || '').toLowerCase().trim()
      
      return nameA.localeCompare(nameB)
    })

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  
  const handleGeneratePDF = async () => {
    if (!selectedTemplate || filteredTickets.length === 0) {
      alert('Please select a template and ensure you have badges to generate')
      return
    }
    
    try {
      setIsGeneratingPDF(true)
      
      // Get all badge elements
      const badgeElements = document.querySelectorAll('.badge') as NodeListOf<HTMLElement>
      
      if (badgeElements.length === 0) {
        alert('No badge elements found to generate PDF')
        return
      }
      
      // Prepare badge data for PDF generation
      const badgeData = Array.from(badgeElements).map(element => ({
        element,
        template: selectedTemplate
      }))
      
      // Generate filename with event name and date
      const eventName = event.name.replace(/[^a-zA-Z0-9]/g, '_')
      const date = new Date().toISOString().split('T')[0]
      const filename = `${eventName}_badges_${date}.pdf`
      
      // Generate PDF
      await generateBadgesPDF(badgeData, filename)
      
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate PDF. Please try again.')
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4 space-x-2">
              <button
                type="button"
                onClick={fetchTickets}
                className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
              >
                Try again
              </button>
              <button
                type="button"
                onClick={onBack}
                className="bg-gray-100 px-3 py-2 rounded-md text-sm font-medium text-gray-800 hover:bg-gray-200"
              >
                Back to Events
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="no-print mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Enhanced Badge Generation for {event.name}</h2>
          <button
            onClick={onBack}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Back to Events
          </button>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-6">
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
            {templates.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">
                No templates available. Create one in the Templates section.
              </p>
            )}
          </div>

          {/* Ticket Type Selection */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Ticket Types</h3>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {ticketTypes.map((ticketType) => (
                <label key={ticketType.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedTicketTypes.has(ticketType.id)}
                    onChange={() => handleTicketTypeToggle(ticketType.id)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex items-center space-x-1">
                    <div
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: eventConfig?.ticketTypeColors?.[ticketType.id] || ticketType.colour }}
                    />
                    <span className="text-sm font-medium text-gray-900 truncate">{ticketType.name}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Field Selection */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Badge Fields</h3>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {availableFields.slice(0, 10).map((field) => (
                <label key={field} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedFields.has(field)}
                    onChange={() => handleFieldToggle(field)}
                    disabled={field === 'holder_name'}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                  />
                  <span className="text-sm text-gray-900 truncate">
                    {getFieldLabel(field)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Badge Count & Print */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Print</h3>
            <div className="space-y-3">
              <div className="text-sm text-gray-600">
                {filteredTickets.length} badge(s) ready
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="sort-alphabetically"
                  checked={sortAlphabetically}
                  onChange={(e) => setSortAlphabetically(e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="sort-alphabetically" className="text-sm text-gray-700">
                  Sort A-Z by name
                </label>
              </div>
              
              <button
                onClick={handleGeneratePDF}
                disabled={filteredTickets.length === 0 || !selectedTemplate || isGeneratingPDF}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingPDF ? 'Generating PDF...' : 'Download PDF'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Badge Preview/Print Area */}
      {selectedTemplate && (
        <div className="badge-grid">
          {filteredTickets.map((ticket, index) => {
            const ticketType = ticketTypes.find(t => t.id === ticket.ticket_type_id)
            const color = eventConfig?.ticketTypeColors?.[ticket.ticket_type_id] || ticketType?.colour || '#3B82F6'
            
            const badgeData = {
              fields: Array.from(selectedFields).map(field => ({
                label: getFieldLabel(field),
                value: getFieldValue(ticket, field)
              })),
              ticketType: {
                ...ticketType,
                colour: color
              } as TicketType,
              eventName: event.name
            }

            return (
              <EnhancedBadgeComponent
                key={`${ticket.id}-${index}`}
                badgeData={badgeData}
                template={selectedTemplate}
              />
            )
          })}
        </div>
      )}

      {!selectedTemplate && (
        <div className="text-center py-12 text-gray-500">
          <p>Select a template to preview badges</p>
        </div>
      )}
    </div>
  )
}