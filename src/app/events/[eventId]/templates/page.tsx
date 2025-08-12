'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import EventLayout from '@/components/EventLayout'
import TemplateManager from '@/components/TemplateManager'

interface DatabaseEvent {
  id: string
  name: string
  tickettailor_event_id: string
  tickettailor_api_key: string
  description: string | null
}

export default function EventTemplatesPage() {
  const params = useParams()
  const eventId = params.eventId as string
  
  const [event, setEvent] = useState<DatabaseEvent | null>(null)
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

      const { data: event, error: dbError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single()

      if (dbError) throw dbError
      setEvent(event)

    } catch (err) {
      console.error('Error fetching event data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch event data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <EventLayout eventId={eventId} eventName="Loading..." currentSection="templates">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading event...</p>
          </div>
        </div>
      </EventLayout>
    )
  }

  if (error || !event) {
    return (
      <EventLayout eventId={eventId} eventName={event?.name || "Error"} currentSection="templates">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">{error || 'Event not found'}</p>
        </div>
      </EventLayout>
    )
  }

  return (
    <EventLayout eventId={eventId} eventName={event.name} currentSection="templates">
      <div>
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Template Management for {event.name}</h2>
          <p className="text-gray-600 mt-1">Create and manage badge templates for this event</p>
        </div>
        <TemplateManager />
      </div>
    </EventLayout>
  )
}