'use client'

import { useState, useEffect } from 'react'
import type { Event, TicketType, Ticket, Badge } from '@/types/tickettailor'
import BadgeComponent from './BadgeComponent'

interface BadgeGeneratorProps {
  event: Event
  ticketTypes: TicketType[]
  onBack: () => void
}

const BADGE_TEMPLATES = [
  { id: 'standard', name: 'Standard Badge', description: 'Simple badge with name and colored footer' },
  { id: 'detailed', name: 'Detailed Badge', description: 'Badge with event details and venue information' },
  { id: 'minimal', name: 'Minimal Badge', description: 'Clean, minimal design with just the essentials' }
]

export default function BadgeGenerator({ event, ticketTypes, onBack }: BadgeGeneratorProps) {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState(BADGE_TEMPLATES[0].id)
  const [selectedTicketTypes, setSelectedTicketTypes] = useState<Set<string>>(new Set())
  const [badges, setBadges] = useState<Badge[]>([])

  useEffect(() => {
    fetchTickets()
  }, [event.id])

  useEffect(() => {
    generateBadges()
  }, [tickets, ticketTypes, selectedTicketTypes])

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
      
      // Select all ticket types by default
      const allTypeIds = new Set(ticketTypes.map(t => t.id))
      setSelectedTicketTypes(allTypeIds)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tickets')
    } finally {
      setLoading(false)
    }
  }

  const generateBadges = () => {
    const filteredTickets = tickets.filter(ticket => 
      selectedTicketTypes.has(ticket.ticket_type_id)
    )

    const badgeData: Badge[] = filteredTickets.map(ticket => {
      const ticketType = ticketTypes.find(t => t.id === ticket.ticket_type_id)
      return {
        attendeeName: ticket.holder_name,
        ticketType: ticketType || ticketTypes[0],
        eventName: event.name
      }
    })

    setBadges(badgeData)
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

  const handlePrint = () => {
    window.print()
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
          <h2 className="text-xl font-semibold text-gray-900">Generate Badges for {event.name}</h2>
          <button
            onClick={onBack}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Back to Events
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Select Template</h3>
            <div className="space-y-2">
              {BADGE_TEMPLATES.map((template) => (
                <label key={template.id} className="flex items-start space-x-3">
                  <input
                    type="radio"
                    name="template"
                    value={template.id}
                    checked={selectedTemplate === template.id}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    className="mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{template.name}</div>
                    <div className="text-sm text-gray-500">{template.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Select Ticket Types</h3>
            <div className="space-y-2">
              {ticketTypes.map((ticketType) => (
                <label key={ticketType.id} className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedTicketTypes.has(ticketType.id)}
                    onChange={() => handleTicketTypeToggle(ticketType.id)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: ticketType.colour }}
                    />
                    <span className="text-sm font-medium text-gray-900">{ticketType.name}</span>
                    <span className="text-sm text-gray-500">
                      ({tickets.filter(t => t.ticket_type_id === ticketType.id).length} attendees)
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="text-sm text-gray-600">
            {badges.length} badge(s) ready to print
          </div>
          <button
            onClick={handlePrint}
            disabled={badges.length === 0}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Print Badges
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {badges.map((badge, index) => (
          <BadgeComponent
            key={index}
            badge={badge}
            template={selectedTemplate}
          />
        ))}
      </div>
    </div>
  )
}