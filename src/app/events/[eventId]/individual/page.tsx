'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import EventLayout from '@/components/EventLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import EnhancedBadgeComponent from '@/components/EnhancedBadgeComponent'
import FlippableBadge from '@/components/FlippableBadge'
import { generateBadgesPDF } from '@/lib/simplePdfGenerator'
import { Search, UserPlus, Printer, Edit3, Check, X } from 'lucide-react'
import type { Event, TicketType } from '@/types/tickettailor'
import type { Template, EventConfiguration } from '@/types/config'
import '../../../../styles/badge-flip.css'

interface DatabaseEvent {
  id: string
  name: string
  tickettailor_event_id: string
  tickettailor_api_key: string
  description: string | null
}

interface Attendee {
  id: string
  holder_name: string
  holder_email: string
  ticket_description: string
  ticket_type_id: string
  custom_fields: Record<string, string>
}

interface BadgeData {
  name: string
  email: string
  jobTitle: string
  company: string
  ticketType: TicketType
  customFields: Record<string, string>
  originalAttendee?: Attendee // Store original attendee data for consistent rawTicket
}

export default function IndividualBadgePage() {
  const params = useParams()
  const eventId = params.eventId as string
  
  const [dbEvent, setDbEvent] = useState<DatabaseEvent | null>(null)
  const [ticketTailorEvent, setTicketTailorEvent] = useState<Event | null>(null)
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [eventConfig, setEventConfig] = useState<EventConfiguration | null>(null)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Attendee[]>([])
  const [selectedAttendee, setSelectedAttendee] = useState<Attendee | null>(null)
  
  // Manual badge creation state
  const [isManualMode, setIsManualMode] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [badgeData, setBadgeData] = useState<BadgeData>({
    name: '',
    email: '',
    jobTitle: '',
    company: '',
    ticketType: { id: '', name: 'General', colour: '#3b82f6' } as TicketType,
    customFields: {}
  })
  
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [printing, setPrinting] = useState(false)
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
        const types = ticketTypesData.ticketTypes || ticketTypesData || []
        setTicketTypes(types)
        
        // Set default ticket type
        if (types.length > 0) {
          setBadgeData(prev => ({ ...prev, ticketType: types[0] }))
        }
      }

      // Fetch templates
      const templatesResponse = await fetch('/api/templates')
      if (templatesResponse.ok) {
        const templatesData = await templatesResponse.json()
        const actualTemplates = templatesData.templates || templatesData // Handle response format
        console.log('Templates loaded:', actualTemplates.length)
        setTemplates(actualTemplates)
        if (actualTemplates.length > 0) {
          console.log('Setting default template:', actualTemplates[0].name)
          setSelectedTemplate(actualTemplates[0])
        }
      } else {
        console.error('Failed to fetch templates:', templatesResponse.status)
      }

      // Fetch event configuration
      const configResponse = await fetch(`/api/event-config?eventId=${event.tickettailor_event_id}`)
      if (configResponse.ok) {
        const config = await configResponse.json()
        setEventConfig(config)
      }

    } catch (err) {
      console.error('Error fetching event data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch event data')
    } finally {
      setLoading(false)
    }
  }

  const searchAttendees = async () => {
    if (!searchQuery.trim() || !dbEvent) return

    try {
      setSearching(true)
      setError(null)
      
      const response = await fetch(`/api/tickets?eventId=${dbEvent.tickettailor_event_id}&search=${encodeURIComponent(searchQuery)}`, {
        headers: { 'X-API-Key': dbEvent.tickettailor_api_key }
      })

      if (!response.ok) {
        throw new Error('Failed to search attendees')
      }

      const data = await response.json()
      const results = (data.tickets || []).map((ticket: any) => ({
        id: ticket.id,
        holder_name: ticket.holder_name,
        holder_email: ticket.holder_email,
        ticket_description: ticket.ticket_description,
        ticket_type_id: ticket.ticket_type_id,
        custom_fields: ticket.custom_fields || {}
      }))

      setSearchResults(results)
    } catch (err) {
      console.error('Error searching attendees:', err)
      setError(err instanceof Error ? err.message : 'Failed to search attendees')
    } finally {
      setSearching(false)
    }
  }

  const selectAttendee = (attendee: Attendee) => {
    const ticketType = ticketTypes.find(t => t.id === attendee.ticket_type_id)
    const finalTicketType = ticketType || ticketTypes[0] || { 
      id: 'general', 
      name: 'General', 
      colour: '#3b82f6' 
    } as TicketType

    // Apply event configuration overrides
    const configuredTicketType = {
      ...finalTicketType,
      name: eventConfig?.ticketTypeNames?.[finalTicketType.id] || finalTicketType.name,
      colour: eventConfig?.ticketTypeColors?.[finalTicketType.id] || finalTicketType.colour
    }
    
    setBadgeData({
      name: attendee.holder_name,
      email: attendee.holder_email,
      jobTitle: attendee.custom_fields.job_title || '',
      company: attendee.custom_fields.company || '',
      ticketType: configuredTicketType,
      customFields: attendee.custom_fields,
      originalAttendee: attendee // Store original attendee data
    })
    
    setSelectedAttendee(attendee)
    setIsManualMode(false)
  }

  const createManualBadge = () => {
    const defaultTicketType = ticketTypes[0] || { id: '', name: 'General', colour: '#3b82f6' }
    
    // Apply event configuration overrides
    const configuredTicketType = {
      ...defaultTicketType,
      name: eventConfig?.ticketTypeNames?.[defaultTicketType.id] || defaultTicketType.name,
      colour: eventConfig?.ticketTypeColors?.[defaultTicketType.id] || defaultTicketType.colour
    }
    
    setBadgeData({
      name: '',
      email: '',
      jobTitle: '',
      company: '',
      ticketType: configuredTicketType,
      customFields: {}
    })
    setSelectedAttendee(null)
    setIsManualMode(true)
  }

  const printBadge = async () => {
    if (!selectedTemplate || !badgeData.name.trim() || !ticketTailorEvent) return

    try {
      setPrinting(true)
      setError(null)

      // Wait a moment for badges to render
      await new Promise(resolve => setTimeout(resolve, 500))

      // Use the visible flippable badge elements
      const badgeFronts = document.querySelectorAll('.badge-front .badge') as NodeListOf<HTMLElement>
      const badgeBacks = document.querySelectorAll('.badge-back .badge') as NodeListOf<HTMLElement>

      if (badgeFronts.length === 0 || badgeBacks.length === 0) {
        throw new Error('Badge preview elements not found')
      }

      // Generate PDF using the first (and only) badge
      await generateBadgesPDF([
        { element: badgeFronts[0], template: selectedTemplate },
        { element: badgeBacks[0], template: selectedTemplate }
      ], `${badgeData.name.replace(/\s+/g, '_')}_badge.pdf`)

    } catch (err) {
      console.error('Error printing badge:', err)
      setError(err instanceof Error ? err.message : 'Failed to print badge')
    } finally {
      setPrinting(false)
    }
  }

  const updateBadgeData = (field: keyof BadgeData, value: any) => {
    setBadgeData(prev => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <EventLayout eventId={eventId} eventName="Loading..." currentSection="individual">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        </div>
      </EventLayout>
    )
  }

  if (error || !dbEvent || !ticketTailorEvent) {
    return (
      <EventLayout eventId={eventId} eventName={dbEvent?.name || "Error"} currentSection="individual">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">{error || 'Event not found'}</p>
        </div>
      </EventLayout>
    )
  }

  const hasValidBadgeData = badgeData.name.trim() && selectedTemplate

  return (
    <EventLayout eventId={eventId} eventName={dbEvent.name} currentSection="individual">
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Column - Search and Form */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Individual Badge Printing</h2>
            <p className="text-gray-600">Search for an existing attendee or create a new badge manually</p>
          </div>

          {/* Search Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Search Attendees
              </CardTitle>
              <CardDescription>Find an existing attendee to print their badge</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter name or email to search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchAttendees()}
                />
                <Button onClick={searchAttendees} disabled={searching || !searchQuery.trim()}>
                  {searching ? 'Searching...' : 'Search'}
                </Button>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {searchResults.map((attendee) => (
                    <div
                      key={attendee.id}
                      className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => selectAttendee(attendee)}
                    >
                      <div className="font-medium">{attendee.holder_name}</div>
                      <div className="text-sm text-gray-500">{attendee.holder_email}</div>
                      <div className="text-sm text-gray-500">{attendee.ticket_description}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Manual Badge Creation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Manual Badge Creation
              </CardTitle>
              <CardDescription>Create a custom badge with your own details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={createManualBadge} variant="outline" className="w-full">
                Create New Badge
              </Button>

              {(selectedAttendee || isManualMode) && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="name">Name</Label>
                    {selectedAttendee && !editingName && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingName(true)}
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Input
                      id="name"
                      value={badgeData.name}
                      onChange={(e) => updateBadgeData('name', e.target.value)}
                      disabled={selectedAttendee && !editingName}
                      placeholder="Enter full name"
                    />
                    {editingName && (
                      <div className="flex gap-1">
                        <Button size="sm" onClick={() => setEditingName(false)}>
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => {
                            updateBadgeData('name', selectedAttendee?.holder_name || '')
                            setEditingName(false)
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={badgeData.email}
                      onChange={(e) => updateBadgeData('email', e.target.value)}
                      placeholder="Enter email address"
                    />
                  </div>

                  <div>
                    <Label htmlFor="jobTitle">Job Title</Label>
                    <Input
                      id="jobTitle"
                      value={badgeData.jobTitle}
                      onChange={(e) => updateBadgeData('jobTitle', e.target.value)}
                      placeholder="Enter job title"
                    />
                  </div>

                  <div>
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      value={badgeData.company}
                      onChange={(e) => updateBadgeData('company', e.target.value)}
                      placeholder="Enter company name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="ticketType">Ticket Type</Label>
                    <select
                      id="ticketType"
                      className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                      value={badgeData.ticketType.id}
                      onChange={(e) => {
                        const ticketType = ticketTypes.find(t => t.id === e.target.value)
                        if (ticketType) {
                          // Apply event configuration overrides
                          const configuredTicketType = {
                            ...ticketType,
                            name: eventConfig?.ticketTypeNames?.[ticketType.id] || ticketType.name,
                            colour: eventConfig?.ticketTypeColors?.[ticketType.id] || ticketType.colour
                          }
                          updateBadgeData('ticketType', configuredTicketType)
                        }
                      }}
                    >
                      {ticketTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {eventConfig?.ticketTypeNames?.[type.id] || type.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Button
                    onClick={printBadge}
                    disabled={!hasValidBadgeData || printing}
                    className="w-full"
                  >
                    {printing ? (
                      'Printing...'
                    ) : (
                      <>
                        <Printer className="w-4 h-4 mr-2" />
                        Print Badge
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Badge Preview */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Badge Preview</h3>
            
            {hasValidBadgeData && selectedTemplate && selectedTemplate.pageSize ? (
              <div className="space-y-4">
                {/* Visible flippable badge preview */}
                <div className="badge-grid">
                  <FlippableBadge
                    template={selectedTemplate}
                    eventName={ticketTailorEvent.name}
                    ticketTypeName={eventConfig?.ticketTypeNames?.[badgeData.ticketType.id] || badgeData.ticketType.name}
                    ticketTypeColor={eventConfig?.ticketTypeColors?.[badgeData.ticketType.id] || badgeData.ticketType.colour}
                    frontContent={
                      <EnhancedBadgeComponent
                        badgeData={{
                          fields: (() => {
                            const availableFields = [
                              { label: 'holder_name', value: badgeData.name },
                              { label: 'job_title', value: badgeData.jobTitle },
                              { label: 'company', value: badgeData.company }
                            ]
                            const displayFields = selectedTemplate.displayFields || ['holder_name']
                            // Filter out any email fields regardless of template settings
                            const nonEmailDisplayFields = displayFields.filter(field => !field.toLowerCase().includes('email'))
                            const filteredFields = availableFields.filter(f => 
                              nonEmailDisplayFields.includes(f.label) && f.value && f.value.trim() !== ''
                            )
                            return filteredFields
                          })(),
                          ticketType: badgeData.ticketType,
                          eventName: ticketTailorEvent.name,
                          rawTicket: badgeData.originalAttendee || {
                            holder_name: badgeData.name,
                            holder_email: badgeData.email,
                            custom_fields: {
                              job_title: badgeData.jobTitle,
                              company: badgeData.company
                            }
                          }
                        }}
                        template={selectedTemplate}
                        isBack={false}
                      />
                    }
                    backContent={
                      <EnhancedBadgeComponent
                        badgeData={{
                          fields: (() => {
                            const availableFields = [
                              { label: 'holder_name', value: badgeData.name },
                              { label: 'job_title', value: badgeData.jobTitle },
                              { label: 'company', value: badgeData.company }
                            ]
                            const displayFields = selectedTemplate.displayFields || ['holder_name']
                            // Filter out any email fields regardless of template settings
                            const nonEmailDisplayFields = displayFields.filter(field => !field.toLowerCase().includes('email'))
                            const filteredFields = availableFields.filter(f => 
                              nonEmailDisplayFields.includes(f.label) && f.value && f.value.trim() !== ''
                            )
                            return filteredFields
                          })(),
                          ticketType: badgeData.ticketType,
                          eventName: ticketTailorEvent.name,
                          rawTicket: badgeData.originalAttendee || {
                            holder_name: badgeData.name,
                            holder_email: badgeData.email,
                            custom_fields: {
                              job_title: badgeData.jobTitle,
                              company: badgeData.company
                            }
                          }
                        }}
                        template={selectedTemplate}
                        isBack={true}
                      />
                    }
                  />
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <p className="text-gray-500">Select an attendee or create a manual badge to see preview</p>
              </div>
            )}
          </div>

          {/* Template Selection */}
          {templates.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Template</CardTitle>
                <CardDescription>Choose a template for the badge</CardDescription>
              </CardHeader>
              <CardContent>
                <select
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  value={selectedTemplate?.id || ''}
                  onChange={(e) => {
                    const template = templates.find(t => t.id === e.target.value)
                    setSelectedTemplate(template || null)
                  }}
                >
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mt-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}
    </EventLayout>
  )
}