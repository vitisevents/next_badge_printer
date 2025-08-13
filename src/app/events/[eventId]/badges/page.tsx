'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import EventLayout from '@/components/EventLayout'
import EnhancedBadgeGenerator from '@/components/EnhancedBadgeGenerator'
import type { Event, TicketType } from '@/types/tickettailor'

interface DatabaseEvent {
  id: string
  name: string
  tickettailor_event_id: string
  tickettailor_api_key: string
  description: string | null
  start_date: string | null
  end_date: string | null
  venue_name: string | null
  venue_location: string | null
}

export default function EventBadgesPage() {
  const params = useParams()
  const eventId = params.eventId as string
  
  const [dbEvent, setDbEvent] = useState<DatabaseEvent | null>(null)
  const [ticketTailorEvent, setTicketTailorEvent] = useState<Event | null>(null)
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (eventId) {
      fetchEventData()
    }
  }, [eventId])

  const fetchEventData = async () => {
    try {
      setLoading(true)
      setError(null)

      // First, get the event from our database
      const { data: event, error: dbError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single()

      if (dbError) throw dbError
      setDbEvent(event)

      // Now fetch the TicketTailor event data using the stored API key
      const ticketTailorResponse = await fetch(`/api/tickettailor/events/${event.tickettailor_event_id}`, {
        headers: {
          'X-API-Key': event.tickettailor_api_key
        }
      })

      if (!ticketTailorResponse.ok) {
        throw new Error('Failed to fetch event from TicketTailor')
      }

      const ticketTailorData = await ticketTailorResponse.json()
      const ttEvent = ticketTailorData.event || ticketTailorData

      // Transform to match the expected Event interface
      const transformedEvent: Event = {
        id: ttEvent.id,
        name: ttEvent.name,
        description: ttEvent.description || '',
        start_date: ttEvent.start_date || null,
        end_date: ttEvent.end_date || null,
        venue: ttEvent.venue || null
      }

      setTicketTailorEvent(transformedEvent)

      // Fetch ticket types
      const ticketTypesResponse = await fetch(`/api/ticket-types?event_id=${event.tickettailor_event_id}`, {
        headers: {
          'X-API-Key': event.tickettailor_api_key
        }
      })

      if (ticketTypesResponse.ok) {
        const ticketTypesData = await ticketTypesResponse.json()
        setTicketTypes(ticketTypesData.ticketTypes || ticketTypesData || [])
      }

    } catch (err) {
      console.error('Error fetching event data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch event data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <EventLayout eventId={eventId} eventName="Loading..." currentSection="badges">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading event...</p>
          </div>
        </div>
      </EventLayout>
    )
  }

  if (error || !dbEvent || !ticketTailorEvent) {
    return (
      <EventLayout eventId={eventId} eventName={dbEvent?.name || "Error"} currentSection="badges">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">{error || 'Event not found'}</p>
        </div>
      </EventLayout>
    )
  }

  return (
    <EventLayout eventId={eventId} eventName={dbEvent.name} currentSection="badges">
      <EnhancedBadgeGenerator 
        event={ticketTailorEvent}
        ticketTypes={ticketTypes}
        eventApiKey={dbEvent.tickettailor_api_key}
        eventId={eventId}
      />
    </EventLayout>
  )
}