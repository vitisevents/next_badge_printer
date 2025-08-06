'use client'

import { useState } from 'react'

interface NavbarProps {
  activeTab: 'templates' | 'events' | 'badges'
  onTabChange: (tab: 'templates' | 'events' | 'badges') => void
}

export default function Navbar({ activeTab, onTabChange }: NavbarProps) {
  const tabs = [
    { id: 'templates', name: 'Templates', icon: '🎨' },
    { id: 'events', name: 'Events', icon: '📅' },
    { id: 'badges', name: 'Badge Generation', icon: '🏷️' },
  ] as const

  return (
    <nav className="bg-white border-b border-gray-200 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Badge Printer</h1>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center">
            <span className="text-sm text-gray-500">
              Professional Badge Printing
            </span>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="sm:hidden">
        <div className="pt-2 pb-3 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`block w-full text-left px-3 py-2 text-base font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-50 border-r-4 border-blue-500 text-blue-700'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </div>
      </div>
    </nav>
  )
}