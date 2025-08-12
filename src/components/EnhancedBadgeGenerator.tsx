'use client'

import { useState, useEffect } from 'react'
import type { Event, TicketType, Ticket } from '@/types/tickettailor'
import type { Template, EventConfiguration, BadgeField, PageSize } from '@/types/config'
import EnhancedBadgeComponent from './EnhancedBadgeComponent'
import FlippableBadge from './FlippableBadge'
import { generateBadgesPDF } from '@/lib/simplePdfGenerator'
import clientLogger from '@/lib/clientLogger'
import '../styles/badge-flip.css'

interface EnhancedBadgeGeneratorProps {
  event: Event
  ticketTypes: TicketType[]
  eventApiKey?: string
}

export default function EnhancedBadgeGenerator({ event, ticketTypes, eventApiKey }: EnhancedBadgeGeneratorProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [tickets, setTickets] = useState<any[]>([])
  const [eventConfig, setEventConfig] = useState<EventConfiguration | null>(null)
  const [selectedTicketTypes, setSelectedTicketTypes] = useState<Set<string>>(new Set())
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set(['holder_name']))
  const [availableFields, setAvailableFields] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'purchase_date' | 'first_name' | 'last_name' | 'first_name_by_type' | 'last_name_by_type'>('purchase_date')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')

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
        clientLogger.log('TEMPLATES', 'Fetching templates...')
        const response = await fetch('/api/templates')
        clientLogger.log('TEMPLATES', `Response status: ${response.status}`)
        
        if (response.ok) {
          const data = await response.json()
          
          clientLogger.log('TEMPLATES', { apiResponse: data })
          
          if (data && data.length > 0) {
            clientLogger.log('TEMPLATES', { loaded: data.length, templates: data })
            setTemplates(data)
            if (data.length > 0 && !selectedTemplate) {
              setSelectedTemplate(data[0])
              clientLogger.log('TEMPLATES', { selectedTemplate: data[0] })
            }
          } else {
            clientLogger.log('TEMPLATES', 'No templates found, creating default template')
          // Create a default template for development
          const defaultTemplate: Template = {
            id: 'default',
            name: 'Default Template',
            description: 'Default template for local development',
            pageSize: {
              id: 'a7',
              name: 'A7',
              width: 74,
              height: 105,
              cssWidth: '74mm',
              cssHeight: '105mm'
            },
            backgroundColor: '#ffffff',
            bleed: 3,
            nameColor: '#111827',
            nameFontSize: 24,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
                      setTemplates([defaultTemplate])
            setSelectedTemplate(defaultTemplate)
            clientLogger.log('TEMPLATES', { createdDefaultTemplate: defaultTemplate })
          }
        } else {
          const errorText = await response.text()
          clientLogger.error('TEMPLATES', { status: response.status, error: errorText })
        }
      } catch (err) {
        clientLogger.error('TEMPLATES', err)
      }
  }

  const fetchTickets = async () => {
    try {
      setLoading(true)
      setError(null)
      
      let url = `/api/tickets?event_id=${event.id}`
      if (dateFrom) {
        url += `&date_from=${dateFrom}`
      }
      if (dateTo) {
        url += `&date_to=${dateTo}`
      }
      
              clientLogger.log('TICKETS', { url })
        const response = await fetch(url, {
          headers: eventApiKey ? { 'X-API-Key': eventApiKey } : undefined
        })
        if (!response.ok) {
          throw new Error('Failed to fetch tickets')
        }
        
        const data = await response.json()
        clientLogger.log('TICKETS', {
          count: data.length,
          sampleTicket: data[0] ? {
            id: data[0].id,
            holder_name: data[0].holder_name,
            holder_email: data[0].holder_email,
            ticket_type_id: data[0].ticket_type_id,
            custom_fields: data[0].custom_fields
          } : null
        })
      
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
        clientLogger.error('EVENT_CONFIG', err)
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
      if (sortBy === 'purchase_date') {
        // Default order from API (purchase date)
        return 0
      }
      
      const nameA = (a.holder_name || '').toLowerCase().trim()
      const nameB = (b.holder_name || '').toLowerCase().trim()
      
      if (sortBy === 'first_name') {
        // Sort by first name
        const firstA = nameA.split(' ')[0] || ''
        const firstB = nameB.split(' ')[0] || ''
        return firstA.localeCompare(firstB)
      } else if (sortBy === 'last_name') {
        // Sort by last name
        const lastA = nameA.split(' ').slice(-1)[0] || ''
        const lastB = nameB.split(' ').slice(-1)[0] || ''
        return lastA.localeCompare(lastB)
      } else if (sortBy === 'first_name_by_type' || sortBy === 'last_name_by_type') {
        // Get the display names (override names if available)
        const ticketTypeA = ticketTypes.find(t => t.id === a.ticket_type_id)
        const ticketTypeB = ticketTypes.find(t => t.id === b.ticket_type_id)
        const overrideNameA = eventConfig?.ticketTypeNames?.[a.ticket_type_id]
        const overrideNameB = eventConfig?.ticketTypeNames?.[b.ticket_type_id]
        
        const displayNameA = overrideNameA || ticketTypeA?.name || 'General Admission'
        const displayNameB = overrideNameB || ticketTypeB?.name || 'General Admission'
        
        // First sort by display name (override name if available)
        if (displayNameA !== displayNameB) {
          return displayNameA.localeCompare(displayNameB)
        }
        
        // Then sort by name within the same display type
        if (sortBy === 'first_name_by_type') {
          const firstA = nameA.split(' ')[0] || ''
          const firstB = nameB.split(' ')[0] || ''
          return firstA.localeCompare(firstB)
        } else {
          const lastA = nameA.split(' ').slice(-1)[0] || ''
          const lastB = nameB.split(' ').slice(-1)[0] || ''
          return lastA.localeCompare(lastB)
        }
      }
      
      return 0
    })

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [pdfProgress, setPdfProgress] = useState({ current: 0, total: 0, percentage: 0 })
  
  const handleGeneratePDF = async () => {
    if (!selectedTemplate || filteredTickets.length === 0) {
      alert('Please select a template and ensure you have badges to generate')
      return
    }
    
    try {
      setIsGeneratingPDF(true)
      setPdfProgress({ current: 0, total: 0, percentage: 0 })
      
      // Wait a moment for badges to render
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Get all badge elements
      const badgeFronts = document.querySelectorAll('.badge-front .badge') as NodeListOf<HTMLElement>
      const badgeBacks = document.querySelectorAll('.badge-back .badge') as NodeListOf<HTMLElement>
      
      console.log(`Found ${badgeFronts.length} front badges and ${badgeBacks.length} back badges`)
      
      if (badgeFronts.length === 0) {
        alert('No badge elements found to generate PDF')
        return
      }
      
      // Prepare badge data for double-sided printing
      const badgeData: Array<{element: HTMLElement, template: Template}> = []
      
      for (let i = 0; i < badgeFronts.length; i++) {
        // Add front
        badgeData.push({
          element: badgeFronts[i],
          template: selectedTemplate
        })
        // Add back if exists
        if (badgeBacks[i]) {
          badgeData.push({
            element: badgeBacks[i],
            template: selectedTemplate
          })
        }
      }
      
      // Generate filename
      const eventName = event.name.replace(/[^a-zA-Z0-9]/g, '_')
      const date = new Date().toISOString().split('T')[0]
      const filename = `${eventName}_badges_double_sided_${date}.pdf`
      
      // Generate PDF
      await generateBadgesPDF(badgeData, filename, (percentage, current, total) => {
        setPdfProgress({ current, total, percentage })
      })
      
    } catch (error) {
      console.error('PDF generation failed:', error)
      alert('Failed to generate PDF. Please try again.')
    } finally {
      setIsGeneratingPDF(false)
      setPdfProgress({ current: 0, total: 0, percentage: 0 })
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
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="no-print mb-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Enhanced Badge Generation for {event.name}</h2>
        </div>

        {/* Date Range Filter */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Date Range Filter</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="date-from" className="block text-sm font-medium text-gray-700 mb-1">
                From Date
              </label>
              <input
                type="date"
                id="date-from"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="date-to" className="block text-sm font-medium text-gray-700 mb-1">
                To Date
              </label>
              <input
                type="date"
                id="date-to"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end space-x-2">
              <button
                onClick={() => {
                  setDateFrom('')
                  setDateTo('')
                  fetchTickets()
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Clear Dates
              </button>
              <button
                onClick={fetchTickets}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
              >
                Apply Filter
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Leave empty to show all tickets. Date range filters orders by purchase date.
          </p>
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
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Order by:</label>
                <div className="space-y-1">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="sortBy"
                      value="purchase_date"
                      checked={sortBy === 'purchase_date'}
                      onChange={(e) => setSortBy('purchase_date')}
                      className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Purchase date</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="sortBy"
                      value="first_name"
                      checked={sortBy === 'first_name'}
                      onChange={(e) => setSortBy('first_name')}
                      className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">First name</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="sortBy"
                      value="last_name"
                      checked={sortBy === 'last_name'}
                      onChange={(e) => setSortBy('last_name')}
                      className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Last name</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="sortBy"
                      value="first_name_by_type"
                      checked={sortBy === 'first_name_by_type'}
                      onChange={(e) => setSortBy('first_name_by_type')}
                      className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">First name (by type)</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="sortBy"
                      value="last_name_by_type"
                      checked={sortBy === 'last_name_by_type'}
                      onChange={(e) => setSortBy('last_name_by_type')}
                      className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Last name (by type)</span>
                  </label>
                </div>
              </div>
              
              <button
                onClick={handleGeneratePDF}
                disabled={filteredTickets.length === 0 || !selectedTemplate || isGeneratingPDF}
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
      {selectedTemplate && (
        <div className="badge-grid">
          {filteredTickets.map((ticket, index) => {
            const ticketType = ticketTypes.find(t => t.id === ticket.ticket_type_id)
            const color = eventConfig?.ticketTypeColors?.[ticket.ticket_type_id] || ticketType?.colour || '#3B82F6'
            const overrideName = eventConfig?.ticketTypeNames?.[ticket.ticket_type_id]
            
            const badgeData = {
              fields: Array.from(selectedFields).map(field => ({
                label: getFieldLabel(field),
                value: getFieldValue(ticket, field)
              })),
              ticketType: {
                ...ticketType,
                name: overrideName || ticketType?.name || 'General Admission',
                colour: color
              } as TicketType,
              eventName: event.name,
              rawTicket: ticket // Pass the raw ticket data for QR code email lookup
            }

            // Only log first few badges to avoid spam
            if (index < 3) {
              clientLogger.log('BADGE_DATA', {
                badgeIndex: index,
                ticketId: ticket.id,
                badgeData,
                selectedFields: Array.from(selectedFields),
                fieldValues: Array.from(selectedFields).map(field => ({
                  field,
                  label: getFieldLabel(field),
                  value: getFieldValue(ticket, field)
                }))
              })
            }

            return (
              <FlippableBadge
                key={`${ticket.id}-${index}`}
                frontContent={
                  <EnhancedBadgeComponent
                    badgeData={badgeData}
                    template={selectedTemplate}
                    isBack={false}
                  />
                }
                backContent={
                  <EnhancedBadgeComponent
                    badgeData={badgeData}
                    template={selectedTemplate}
                    isBack={true}
                  />
                }
                template={selectedTemplate}
                eventName={event.name}
                ticketTypeName={overrideName || ticketType?.name || 'General Admission'}
                ticketTypeColor={color}
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