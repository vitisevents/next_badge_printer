'use client'

import { useState, useEffect } from 'react'
import type { Event, TicketType } from '@/types/tickettailor'

interface EventSelectorProps {
  onEventSelect: (event: Event, ticketTypes: TicketType[]) => void
}

export default function EventSelector({ onEventSelect }: EventSelectorProps) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/events')
      if (!response.ok) {
        throw new Error('Failed to fetch events')
      }
      
      const data = await response.json()
      setEvents(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleEventSelect = async (event: Event) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/ticket-types?event_id=${event.id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch ticket types')
      }
      
      const ticketTypes = await response.json()
      onEventSelect(event, ticketTypes)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load ticket types')
    } finally {
      setLoading(false)
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
            <div className="mt-4">
              <button
                type="button"
                onClick={fetchEvents}
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
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Select an Event</h2>
      
      {events.length === 0 ? (
        <p className="text-gray-500">No events found.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <div
              key={event.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md cursor-pointer transition-all"
              onClick={() => handleEventSelect(event)}
            >
              <h3 className="font-medium text-gray-900 mb-2">{event.name}</h3>
              
              {event.description && (
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                  {event.description}
                </p>
              )}
              
              <div className="text-sm text-gray-500 space-y-1">
                <p>
                  <strong>Start:</strong> {new Date(event.start_date).toLocaleDateString()}
                </p>
                <p>
                  <strong>End:</strong> {new Date(event.end_date).toLocaleDateString()}
                </p>
                {event.venue && (
                  <p>
                    <strong>Venue:</strong> {event.venue.name}
                  </p>
                )}
              </div>
              
              <div className="mt-3">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Select Event
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}