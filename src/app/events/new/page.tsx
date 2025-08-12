'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, ExternalLink, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface TicketTailorEvent {
  id: string
  name: string
  description?: string
  start_date?: {
    iso: string
    formatted: string
  }
  end_date?: {
    iso: string
    formatted: string
  }
  venue?: {
    name: string
    country: string
    postal_code: string
  }
}

export default function NewEventPage() {
  const router = useRouter()
  const [apiKey, setApiKey] = useState('')
  const [eventId, setEventId] = useState('')
  const [loading, setLoading] = useState(false)
  const [eventData, setEventData] = useState<TicketTailorEvent | null>(null)
  const [error, setError] = useState<string | null>(null)

  const validateAndFetchEvent = async () => {
    if (!apiKey.trim() || !eventId.trim()) {
      setError('Please provide both API key and Event ID')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Test the API connection by fetching event details
      const response = await fetch(`/api/tickettailor/events/${eventId}`, {
        headers: {
          'X-API-Key': apiKey
        }
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid API key')
        } else if (response.status === 404) {
          throw new Error('Event not found')
        } else {
          throw new Error('Failed to connect to TicketTailor')
        }
      }

      const data = await response.json()
      setEventData(data.event || data) // Handle different response structures
    } catch (err) {
      console.error('Error validating event:', err)
      setError(err instanceof Error ? err.message : 'Failed to validate event')
      setEventData(null)
    } finally {
      setLoading(false)
    }
  }

  const saveEvent = async () => {
    if (!eventData) return

    setLoading(true)
    setError(null)

    try {
      const { error: insertError } = await supabase
        .from('events')
        .insert({
          name: eventData.name,
          tickettailor_event_id: eventData.id,
          tickettailor_api_key: apiKey,
          description: eventData.description || null,
          start_date: eventData.start_date?.iso || null,
          end_date: eventData.end_date?.iso || null,
          venue_name: eventData.venue?.name || null,
          venue_location: eventData.venue ? `${eventData.venue.country}${eventData.venue.postal_code ? ' ' + eventData.venue.postal_code : ''}` : null
        })

      if (insertError) throw insertError

      // Redirect to the dashboard
      router.push('/')
    } catch (err) {
      console.error('Error saving event:', err)
      setError(err instanceof Error ? err.message : 'Failed to save event')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add New Event</h1>
            <p className="text-gray-600">Connect a TicketTailor event for badge generation</p>
          </div>
        </div>

        {/* API Key and Event ID Form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Connect TicketTailor Event</CardTitle>
            <CardDescription>
              Enter your TicketTailor API key and event ID to connect your event.{' '}
              <a 
                href="https://developers.tickettailor.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline inline-flex items-center"
              >
                Get API key
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="tk_test_..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="eventId">Event ID</Label>
              <Input
                id="eventId"
                placeholder="ev_123456"
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">
                You can find the Event ID in your TicketTailor dashboard URL
              </p>
            </div>

            <Button
              onClick={validateAndFetchEvent}
              disabled={loading || !apiKey.trim() || !eventId.trim()}
              className="w-full"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {eventData ? 'Refresh Event Details' : 'Validate Event'}
            </Button>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Event Preview */}
        {eventData && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
              <CardDescription>
                Confirm these details are correct before adding the event
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Event Name</Label>
                <p className="text-lg font-semibold">{eventData.name}</p>
              </div>

              {eventData.description && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">Description</Label>
                  <p className="text-gray-600">{eventData.description}</p>
                </div>
              )}

              {eventData.start_date && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">Start Date</Label>
                  <p className="text-gray-600">{formatDate(eventData.start_date.iso)}</p>
                </div>
              )}

              {eventData.end_date && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">End Date</Label>
                  <p className="text-gray-600">{formatDate(eventData.end_date.iso)}</p>
                </div>
              )}

              {eventData.venue && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">Venue</Label>
                  <p className="text-gray-600">
                    {eventData.venue.name}
                    {eventData.venue.country && (
                      <span className="text-gray-500">
                        {' • '}{eventData.venue.country}
                        {eventData.venue.postal_code && ` ${eventData.venue.postal_code}`}
                      </span>
                    )}
                  </p>
                </div>
              )}

              <div className="pt-4 border-t">
                <Button
                  onClick={saveEvent}
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Add Event to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}