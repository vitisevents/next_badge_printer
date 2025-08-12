'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ChevronDown, Users, Settings, FileText } from 'lucide-react'

interface EventLayoutProps {
  eventId: string
  eventName: string
  currentSection: string
  children: React.ReactNode
}

interface NavSection {
  id: string
  label: string
  icon: React.ReactNode
  href?: string
  children?: Array<{
    id: string
    label: string
    href: string
  }>
}

export default function EventLayout({ eventId, eventName, currentSection, children }: EventLayoutProps) {
  const [badgeDropdownOpen, setBadgeDropdownOpen] = useState(false)

  const navSections: NavSection[] = [
    {
      id: 'badges',
      label: 'Badge Management',
      icon: <Users className="w-4 h-4" />,
      children: [
        {
          id: 'badges',
          label: 'Generate Badges',
          href: `/events/${eventId}/badges`
        },
        {
          id: 'individual',
          label: 'Individual Badge',
          href: `/events/${eventId}/individual`
        },
        {
          id: 'templates',
          label: 'Manage Templates',
          href: `/events/${eventId}/templates`
        }
      ]
    },
    {
      id: 'config',
      label: 'Event Configuration',
      icon: <Settings className="w-4 h-4" />,
      href: `/events/${eventId}/config`
    }
  ]

  const getCurrentSectionLabel = () => {
    for (const section of navSections) {
      if (section.children) {
        const child = section.children.find(c => c.id === currentSection)
        if (child) return child.label
      } else if (section.id === currentSection) {
        return section.label
      }
    }
    return currentSection
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{eventName}</h1>
                <p className="text-sm text-gray-500">{getCurrentSectionLabel()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {navSections.map((section) => {
              if (section.children) {
                const isActive = section.children.some(child => child.id === currentSection)
                const isOpen = section.id === 'badges' && badgeDropdownOpen

                return (
                  <div key={section.id} className="relative">
                    <button
                      onClick={() => setBadgeDropdownOpen(!badgeDropdownOpen)}
                      className={`flex items-center px-1 py-4 text-sm font-medium border-b-2 transition-colors ${
                        isActive 
                          ? 'border-blue-500 text-blue-600' 
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {section.icon}
                      <span className="ml-2">{section.label}</span>
                      <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown */}
                    {isOpen && (
                      <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                        <div className="py-1">
                          {section.children.map((child) => (
                            <Link
                              key={child.id}
                              href={child.href}
                              onClick={() => setBadgeDropdownOpen(false)}
                              className={`block px-4 py-2 text-sm transition-colors ${
                                child.id === currentSection
                                  ? 'bg-blue-50 text-blue-600'
                                  : 'text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              } else {
                const isActive = section.id === currentSection
                return (
                  <Link
                    key={section.id}
                    href={section.href!}
                    className={`flex items-center px-1 py-4 text-sm font-medium border-b-2 transition-colors ${
                      isActive 
                        ? 'border-blue-500 text-blue-600' 
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {section.icon}
                    <span className="ml-2">{section.label}</span>
                  </Link>
                )
              }
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Click outside to close dropdown */}
      {badgeDropdownOpen && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setBadgeDropdownOpen(false)}
        />
      )}
    </div>
  )
}