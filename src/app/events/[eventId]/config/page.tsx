'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import EventLayout from '@/components/EventLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Save, Palette, Type, AlertCircle } from 'lucide-react'
import type { Event, TicketType } from '@/types/tickettailor'
import type { EventConfiguration } from '@/types/config'

interface DatabaseEvent {
  id: string
  name: string
  tickettailor_event_id: string
  tickettailor_api_key: string
  description: string | null
}

export default function EventConfigPage() {
  const params = useParams()
  const eventId = params.eventId as string
  
  const [dbEvent, setDbEvent] = useState<DatabaseEvent | null>(null)
  const [ticketTailorEvent, setTicketTailorEvent] = useState<Event | null>(null)
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([])
  const [eventConfig, setEventConfig] = useState<EventConfiguration | null>(null)
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    if (eventId) {
      fetchEventData()
    }
  }, [eventId])

  const fetchEventData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get event from database
      const { data: event, error: dbError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single()

      if (dbError) throw dbError
      setDbEvent(event)

      // Fetch TicketTailor event data
      const ticketTailorResponse = await fetch(`/api/tickettailor/events/${event.tickettailor_event_id}`, {
        headers: { 'X-API-Key': event.tickettailor_api_key }
      })

      if (!ticketTailorResponse.ok) {
        throw new Error('Failed to fetch event from TicketTailor')
      }

      const ticketTailorData = await ticketTailorResponse.json()
      const ttEvent = ticketTailorData.event || ticketTailorData

      setTicketTailorEvent({
        id: ttEvent.id,
        name: ttEvent.name,
        description: ttEvent.description || '',
        start_date: ttEvent.start_date || null,
        end_date: ttEvent.end_date || null,
        venue: ttEvent.venue || null
      })

      // Fetch ticket types
      const ticketTypesResponse = await fetch(`/api/ticket-types?event_id=${event.tickettailor_event_id}`, {
        headers: { 'X-API-Key': event.tickettailor_api_key }
      })

      if (ticketTypesResponse.ok) {
        const ticketTypesData = await ticketTypesResponse.json()
        setTicketTypes(ticketTypesData || [])
      }

      // Fetch existing event configuration
      const configResponse = await fetch(`/api/event-config?eventId=${event.tickettailor_event_id}`)
      if (configResponse.ok) {
        const config = await configResponse.json()
        if (config) {
          setEventConfig(config)
        } else {
          // Initialize default config
          setEventConfig({
            eventId: event.tickettailor_event_id,
            eventName: ttEvent.name,
            ticketTypeColors: {},
            ticketTypeNames: {},
            customFields: [],
            badgeFields: [],
            updatedAt: new Date().toISOString()
          })
        }
      }

    } catch (err) {
      console.error('Error fetching event data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch event data')
    } finally {
      setLoading(false)
    }
  }

  const handleColorChange = (ticketTypeId: string, color: string) => {
    if (!eventConfig) return
    
    setEventConfig({
      ...eventConfig,
      ticketTypeColors: {
        ...eventConfig.ticketTypeColors,
        [ticketTypeId]: color
      }
    })
  }

  const handleNameChange = (ticketTypeId: string, name: string) => {
    if (!eventConfig) return
    
    setEventConfig({
      ...eventConfig,
      ticketTypeNames: {
        ...eventConfig.ticketTypeNames,
        [ticketTypeId]: name
      }
    })
  }

  const saveConfiguration = async () => {
    if (!eventConfig || !dbEvent) return

    try {
      setSaving(true)
      setError(null)
      setSuccessMessage(null)

      const response = await fetch('/api/event-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventConfig)
      })

      if (!response.ok) {
        throw new Error('Failed to save configuration')
      }

      const savedConfig = await response.json()
      setEventConfig(savedConfig)
      setSuccessMessage('Configuration saved successfully!')
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000)

    } catch (err) {
      console.error('Error saving configuration:', err)
      setError(err instanceof Error ? err.message : 'Failed to save configuration')
    } finally {
      setSaving(false)
    }
  }

  const resetTicketType = (ticketTypeId: string) => {
    if (!eventConfig) return

    const newConfig = { ...eventConfig }
    delete newConfig.ticketTypeColors[ticketTypeId]
    delete newConfig.ticketTypeNames[ticketTypeId]
    
    setEventConfig(newConfig)
  }

  if (loading) {
    return (
      <EventLayout eventId={eventId} eventName="Loading..." currentSection="config">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        </div>
      </EventLayout>
    )
  }

  if (error || !dbEvent || !ticketTailorEvent || !eventConfig) {
    return (
      <EventLayout eventId={eventId} eventName={dbEvent?.name || "Error"} currentSection="config">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">{error || 'Event not found'}</p>
        </div>
      </EventLayout>
    )
  }

  return (
    <EventLayout eventId={eventId} eventName={dbEvent.name} currentSection="config">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Event Configuration</h2>
          <p className="text-gray-600">
            Customize badge colors and ticket type names for {ticketTailorEvent.name}
          </p>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Ticket Type Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Ticket Type Configuration
            </CardTitle>
            <CardDescription>
              Customize the appearance and display names for each ticket type
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {ticketTypes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Type className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>No ticket types found for this event</p>
                <p className="text-sm">Make sure the event has ticket sales to see ticket types here.</p>
              </div>
            ) : (
              ticketTypes.map((ticketType) => {
                const currentColor = eventConfig.ticketTypeColors?.[ticketType.id] || ticketType.colour || '#3B82F6'
                const currentName = eventConfig.ticketTypeNames?.[ticketType.id] || ''
                
                return (
                  <div key={ticketType.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-6 h-6 rounded border-2 border-gray-300"
                          style={{ backgroundColor: currentColor }}
                        />
                        <div>
                          <h4 className="font-medium text-gray-900">{ticketType.name}</h4>
                          <p className="text-sm text-gray-500">ID: {ticketType.id}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => resetTicketType(ticketType.id)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        Reset
                      </Button>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`color-${ticketType.id}`}>Badge Color</Label>
                        <div className="flex gap-2 mt-1">
                          <input
                            type="color"
                            id={`color-${ticketType.id}`}
                            value={currentColor}
                            onChange={(e) => handleColorChange(ticketType.id, e.target.value)}
                            className="w-12 h-9 rounded border border-gray-300 cursor-pointer"
                          />
                          <Input
                            type="text"
                            value={currentColor}
                            onChange={(e) => handleColorChange(ticketType.id, e.target.value)}
                            placeholder="#3B82F6"
                            className="font-mono text-sm"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor={`name-${ticketType.id}`}>
                          Display Name Override (Optional)
                        </Label>
                        <Input
                          id={`name-${ticketType.id}`}
                          type="text"
                          value={currentName}
                          onChange={(e) => handleNameChange(ticketType.id, e.target.value)}
                          placeholder={`Leave empty to use "${ticketType.name}"`}
                          className="mt-1"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Will show as: <strong>{currentName || ticketType.name}</strong>
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={saveConfiguration}
            disabled={saving}
            className="flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Configuration
              </>
            )}
          </Button>
        </div>
      </div>
    </EventLayout>
  )
}