'use client'

import { useState, useEffect } from 'react'
import type { Event, TicketType } from '@/types/tickettailor'
import type { EventConfiguration, CustomField, BadgeField } from '@/types/config'
import BadgeFieldConfig from './BadgeFieldConfig'

export default function EventManager() {
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([])
  const [eventConfig, setEventConfig] = useState<EventConfiguration | null>(null)
  const [customFields, setCustomFields] = useState<CustomField[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchEvents()
  }, [])

  useEffect(() => {
    if (selectedEvent) {
      fetchTicketTypes(selectedEvent.id)
      fetchEventConfig(selectedEvent.id)
      extractCustomFields(selectedEvent.id)
    }
  }, [selectedEvent])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/events')
      if (!response.ok) throw new Error('Failed to fetch events')
      const data = await response.json()
      setEvents(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch events')
    } finally {
      setLoading(false)
    }
  }

  const fetchTicketTypes = async (eventId: string) => {
    try {
      const response = await fetch(`/api/ticket-types?event_id=${eventId}`)
      if (!response.ok) throw new Error('Failed to fetch ticket types')
      const data = await response.json()
      setTicketTypes(data)
    } catch (err) {
      console.error('Error fetching ticket types:', err)
    }
  }

  const fetchEventConfig = async (eventId: string) => {
    try {
      const response = await fetch(`/api/event-config?eventId=${eventId}`)
      if (response.ok) {
        const config = await response.json()
        setEventConfig(config)
      } else {
        setEventConfig(null)
      }
    } catch (err) {
      console.error('Error fetching event config:', err)
      setEventConfig(null)
    }
  }

  const extractCustomFields = async (eventId: string) => {
    try {
      // Get orders directly to extract custom questions
      const response = await fetch('/api/orders?event_id=' + eventId)
      if (response.ok) {
        const orders = await response.json()
        
        console.log('Sample order data for field extraction:', orders[0]) // Debug log
        console.log('Total orders found:', orders.length) // Debug log
        
        // Get all custom question keys from orders
        const fieldsSet = new Set<string>()
        const customQuestionsSet = new Set<string>()
        
        // Add standard fields
        fieldsSet.add('holder_name')
        fieldsSet.add('holder_email')
        fieldsSet.add('ticket_type')
        fieldsSet.add('order_reference')
        fieldsSet.add('buyer_first_name')
        fieldsSet.add('buyer_last_name')
        fieldsSet.add('buyer_phone')
        
        orders.forEach((order: any) => {
          if (order.event_summary?.event_id === eventId) {
            // Extract from buyer details custom questions
            if (order.buyer_details?.custom_questions) {
              order.buyer_details.custom_questions.forEach((q: any) => {
                if (q.question) {
                  const fieldKey = q.question.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_')
                  customQuestionsSet.add(fieldKey)
                  fieldsSet.add(`custom_${fieldKey}`)
                  console.log('Found buyer custom question:', q.question, '-> custom_' + fieldKey) // Debug log
                }
              })
            }
            
            // Extract from issued tickets custom questions
            if (order.issued_tickets) {
              order.issued_tickets.forEach((ticket: any) => {
                if (ticket.custom_questions) {
                  ticket.custom_questions.forEach((q: any) => {
                    if (q.question) {
                      const fieldKey = q.question.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_')
                      customQuestionsSet.add(fieldKey)
                      fieldsSet.add(`custom_${fieldKey}`)
                      console.log('Found ticket custom question:', q.question, '-> custom_' + fieldKey) // Debug log
                    }
                  })
                }
              })
            }
          }
        })
        
        console.log('All discovered fields:', Array.from(fieldsSet)) // Debug log
        console.log('Custom questions found:', Array.from(customQuestionsSet)) // Debug log
        
        const fields: CustomField[] = Array.from(fieldsSet).map(key => ({
          key,
          label: formatFieldLabel(key),
          type: 'text',
          required: false
        }))
        
        setCustomFields(fields)
      }
    } catch (err) {
      console.error('Error extracting custom fields:', err)
    }
  }

  const formatFieldLabel = (key: string): string => {
    if (key.startsWith('custom_')) {
      // For custom fields, remove the custom_ prefix and format nicely
      return key.replace('custom_', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }
    return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const handleColorChange = (ticketTypeId: string, color: string) => {
    if (!selectedEvent) return

    const newConfig: EventConfiguration = {
      eventId: selectedEvent.id,
      eventName: selectedEvent.name,
      ticketTypeColors: {
        ...(eventConfig?.ticketTypeColors || {}),
        [ticketTypeId]: color
      },
      ticketTypeNames: eventConfig?.ticketTypeNames || {},
      customFields: eventConfig?.customFields || customFields,
      badgeFields: eventConfig?.badgeFields || [],
      updatedAt: new Date().toISOString()
    }

    setEventConfig(newConfig)
  }

  const handleNameChange = (ticketTypeId: string, customName: string) => {
    if (!selectedEvent) return

    const newConfig: EventConfiguration = {
      eventId: selectedEvent.id,
      eventName: selectedEvent.name,
      ticketTypeColors: eventConfig?.ticketTypeColors || {},
      ticketTypeNames: {
        ...(eventConfig?.ticketTypeNames || {}),
        [ticketTypeId]: customName
      },
      customFields: eventConfig?.customFields || customFields,
      badgeFields: eventConfig?.badgeFields || [],
      updatedAt: new Date().toISOString()
    }

    setEventConfig(newConfig)
  }

  const handleSaveConfig = async () => {
    if (!selectedEvent || !eventConfig) return

    try {
      setSaving(true)
      const response = await fetch('/api/event-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventConfig)
      })

      if (!response.ok) throw new Error('Failed to save configuration')
      
      alert('Event configuration saved successfully!')
    } catch (err) {
      console.error('Error saving config:', err)
      alert('Failed to save configuration')
    } finally {
      setSaving(false)
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
        <h3 className="text-sm font-medium text-red-800">Error</h3>
        <p className="mt-2 text-sm text-red-700">{error}</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Event Manager</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure colors and custom fields for your events
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Event Selection */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Event</h2>
          
          {events.length === 0 ? (
            <p className="text-gray-500">No events found.</p>
          ) : (
            <div className="space-y-2">
              {events.map((event) => (
                <button
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className={`w-full text-left p-3 rounded-md transition-colors ${
                    selectedEvent?.id === event.id
                      ? 'bg-blue-50 border-2 border-blue-200'
                      : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="font-medium text-gray-900">{event.name}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(event.start_date).toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Ticket Type Configuration */}
        {selectedEvent && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Ticket Type Configuration
            </h2>
            
            {ticketTypes.length === 0 ? (
              <p className="text-gray-500">No ticket types found for this event.</p>
            ) : (
              <div className="space-y-6">
                {ticketTypes.map((ticketType) => (
                  <div key={ticketType.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="space-y-4">
                      <div>
                        <div className="font-medium text-gray-900 mb-1">{ticketType.name}</div>
                        <div className="text-sm text-gray-500">{ticketType.description}</div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Badge Display Name
                          </label>
                          <input
                            type="text"
                            placeholder={ticketType.name}
                            value={eventConfig?.ticketTypeNames?.[ticketType.id] || ''}
                            onChange={(e) => handleNameChange(ticketType.id, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Override the name shown on badges (leave empty to use original name)
                          </p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Badge Color
                          </label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="color"
                              value={eventConfig?.ticketTypeColors?.[ticketType.id] || ticketType.colour}
                              onChange={(e) => handleColorChange(ticketType.id, e.target.value)}
                              className="w-10 h-8 border border-gray-300 rounded cursor-pointer"
                            />
                            <input
                              type="text"
                              value={eventConfig?.ticketTypeColors?.[ticketType.id] || ticketType.colour}
                              onChange={(e) => handleColorChange(ticketType.id, e.target.value)}
                              className="flex-1 px-2 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="#000000"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        </div>

        {/* Badge Field Configuration */}
        {selectedEvent && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <BadgeFieldConfig
              fields={eventConfig?.badgeFields || []}
              availableFields={customFields.map(f => f.key)}
              onFieldsChange={(fields) => {
                if (!selectedEvent) return
                const newConfig: EventConfiguration = {
                  eventId: selectedEvent.id,
                  eventName: selectedEvent.name,
                  ticketTypeColors: eventConfig?.ticketTypeColors || {},
                  ticketTypeNames: eventConfig?.ticketTypeNames || {},
                  customFields: eventConfig?.customFields || customFields,
                  badgeFields: fields,
                  updatedAt: new Date().toISOString()
                }
                setEventConfig(newConfig)
              }}
            />
          </div>
        )}
      </div>

      {/* Save Button */}
      {selectedEvent && eventConfig && (
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSaveConfig}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2 rounded-md font-medium transition-colors"
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      )}
    </div>
  )
}