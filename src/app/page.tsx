'use client'

import { useState } from 'react'
import Navbar from '@/components/Navbar'
import TemplateManager from '@/components/TemplateManager'
import EventManager from '@/components/EventManager'
import EventSelector from '@/components/EventSelector'
import EnhancedBadgeGenerator from '@/components/EnhancedBadgeGenerator'
import type { Event, TicketType } from '@/types/tickettailor'

type ActiveTab = 'templates' | 'events' | 'badges'

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('badges')
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([])

  const renderContent = () => {
    switch (activeTab) {
      case 'templates':
        return <TemplateManager />
      
      case 'events':
        return <EventManager />
      
      case 'badges':
        if (!selectedEvent) {
          return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <EventSelector 
                onEventSelect={(event, types) => {
                  setSelectedEvent(event)
                  setTicketTypes(types)
                }}
              />
            </div>
          )
        } else {
          return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <EnhancedBadgeGenerator 
                event={selectedEvent}
                ticketTypes={ticketTypes}
                onBack={() => {
                  setSelectedEvent(null)
                  setTicketTypes([])
                }}
              />
            </div>
          )
        }
      
      default:
        return <div>Page not found</div>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
      <main>
        {renderContent()}
      </main>
    </div>
  )
}