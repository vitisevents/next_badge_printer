'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import EventLayout from '@/components/EventLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CalendarDays, MapPin, Trash2, Save, Loader2 } from 'lucide-react'

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
  created_at: string
}

export default function EventSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.eventId as string
  
  const [event, setEvent] = useState<DatabaseEvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tickettailor_api_key: ''
  })

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
      setFormData({
        name: event.name,
        description: event.description || '',
        tickettailor_api_key: event.tickettailor_api_key
      })

    } catch (err) {
      console.error('Error fetching event data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch event data')
    } finally {
      setLoading(false)
    }
  }

  const saveEvent = async () => {
    if (!event) return

    try {
      setSaving(true)
      setError(null)

      const { error: updateError } = await supabase
        .from('events')
        .update({
          name: formData.name,
          description: formData.description || null,
          tickettailor_api_key: formData.tickettailor_api_key
        })
        .eq('id', eventId)

      if (updateError) throw updateError

      // Update local state
      setEvent({ ...event, ...formData })
      
      // Show success (you could add a toast notification here)
      console.log('Event updated successfully')

    } catch (err) {
      console.error('Error updating event:', err)
      setError(err instanceof Error ? err.message : 'Failed to update event')
    } finally {
      setSaving(false)
    }
  }

  const deleteEvent = async () => {
    if (!event || !confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return
    }

    try {
      setDeleting(true)
      setError(null)

      const { error: deleteError } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)

      if (deleteError) throw deleteError

      // Redirect to dashboard
      router.push('/')

    } catch (err) {
      console.error('Error deleting event:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete event')
      setDeleting(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set'
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <EventLayout eventId={eventId} eventName="Loading..." currentSection="settings">
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
      <EventLayout eventId={eventId} eventName={event?.name || "Error"} currentSection="settings">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">{error || 'Event not found'}</p>
        </div>
      </EventLayout>
    )
  }

  return (
    <EventLayout eventId={eventId} eventName={event.name} currentSection="settings">
      <div className="max-w-2xl">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Event Settings</h2>
          <p className="text-gray-600 mt-1">Manage your event configuration and TicketTailor integration</p>
        </div>

        {/* Event Information Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Event Information</CardTitle>
            <CardDescription>
              Basic event details from TicketTailor
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(event.start_date || event.end_date) && (
              <div className="flex items-center text-sm text-gray-600">
                <CalendarDays className="w-4 h-4 mr-2" />
                <span>
                  {formatDate(event.start_date)}
                  {event.end_date && event.start_date !== event.end_date && (
                    <span> - {formatDate(event.end_date)}</span>
                  )}
                </span>
              </div>
            )}
            
            {(event.venue_name || event.venue_location) && (
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="w-4 h-4 mr-2" />
                <span>
                  {event.venue_name}
                  {event.venue_location && (
                    <span className="text-gray-500"> • {event.venue_location}</span>
                  )}
                </span>
              </div>
            )}

            <div className="text-sm">
              <span className="font-medium">TicketTailor Event ID:</span>{' '}
              <span className="font-mono text-gray-600">{event.tickettailor_event_id}</span>
            </div>
          </CardContent>
        </Card>

        {/* Editable Settings Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>
              Update your event settings and API configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Event Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional event description"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="apiKey">TicketTailor API Key</Label>
              <Input
                id="apiKey"
                type="password"
                value={formData.tickettailor_api_key}
                onChange={(e) => setFormData({ ...formData, tickettailor_api_key: e.target.value })}
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">
                Update if you need to change the API key for this event
              </p>
            </div>

            <Button
              onClick={saveEvent}
              disabled={saving}
              className="w-full"
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </CardContent>
        </Card>

        {/* Danger Zone Card */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
            <CardDescription>
              Permanently delete this event and all associated data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={deleteEvent}
              disabled={deleting}
              variant="destructive"
              className="w-full"
            >
              {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Event
            </Button>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mt-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}
      </div>
    </EventLayout>
  )
}