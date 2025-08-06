'use client'

import type { Badge } from '@/types/tickettailor'

interface BadgeComponentProps {
  badge: Badge
  template: string
}

export default function BadgeComponent({ badge, template }: BadgeComponentProps) {
  const renderStandardBadge = () => (
    <div className="badge w-80 h-96 bg-white border-2 border-gray-300 rounded-lg shadow-lg flex flex-col">
      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {badge.attendeeName}
          </h2>
          <div className="text-sm text-gray-600">
            {badge.eventName}
          </div>
        </div>
      </div>
      
      <div 
        className="h-16 flex items-center justify-center rounded-b-lg"
        style={{ backgroundColor: badge.ticketType.colour }}
      >
        <span className="text-white font-semibold text-lg">
          {badge.ticketType.name}
        </span>
      </div>
    </div>
  )

  const renderDetailedBadge = () => (
    <div className="badge w-80 h-96 bg-white border-2 border-gray-300 rounded-lg shadow-lg flex flex-col">
      <div className="p-4 bg-gray-50 border-b rounded-t-lg">
        <h3 className="text-lg font-semibold text-gray-900 text-center truncate">
          {badge.eventName}
        </h3>
      </div>
      
      <div className="flex-1 flex items-center justify-center px-6 py-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {badge.attendeeName}
          </h2>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center justify-center space-x-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: badge.ticketType.colour }}
              />
              <span>{badge.ticketType.name}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div 
        className="h-12 flex items-center justify-center rounded-b-lg"
        style={{ backgroundColor: badge.ticketType.colour }}
      >
        <span className="text-white font-medium">
          {badge.ticketType.name}
        </span>
      </div>
    </div>
  )

  const renderMinimalBadge = () => (
    <div className="badge w-80 h-96 bg-white border border-gray-200 rounded-lg shadow-md flex flex-col">
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="text-center">
          <h2 className="text-4xl font-light text-gray-900 mb-6">
            {badge.attendeeName}
          </h2>
          <div className="text-base text-gray-500 font-light">
            {badge.eventName}
          </div>
        </div>
      </div>
      
      <div 
        className="h-8 rounded-b-lg"
        style={{ backgroundColor: badge.ticketType.colour }}
      >
        <div className="h-full flex items-center justify-center">
          <span className="text-white text-sm font-medium">
            {badge.ticketType.name}
          </span>
        </div>
      </div>
    </div>
  )

  const renderBadge = () => {
    switch (template) {
      case 'detailed':
        return renderDetailedBadge()
      case 'minimal':
        return renderMinimalBadge()
      default:
        return renderStandardBadge()
    }
  }

  return (
    <div className="p-4">
      {renderBadge()}
    </div>
  )
}