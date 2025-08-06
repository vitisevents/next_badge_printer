'use client'

import { useState } from 'react'
import type { BadgeField, FontStyle } from '@/types/config'
import FontPicker from './FontPicker'

interface BadgeFieldConfigProps {
  fields: BadgeField[]
  availableFields: string[]
  onFieldsChange: (fields: BadgeField[]) => void
}

const DEFAULT_FONT_STYLE: FontStyle = {
  fontFamily: 'Inter',
  fontSize: 16,
  fontWeight: '400',
  color: '#000000',
  textAlign: 'center',
  lineHeight: 1.4
}

const FIELD_PRESETS: Record<string, Partial<FontStyle>> = {
  'holder_name': {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center'
  },
  'event_name': {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center'
  },
  'ticket_type': {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff'
  }
}

export default function BadgeFieldConfig({ fields, availableFields, onFieldsChange }: BadgeFieldConfigProps) {
  const [expandedField, setExpandedField] = useState<string | null>(null)

  const formatFieldLabel = (field: string): string => {
    if (field.startsWith('custom_')) {
      return field.replace('custom_', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }
    return field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const addField = (fieldKey: string) => {
    const preset = FIELD_PRESETS[fieldKey] || {}
    const newField: BadgeField = {
      id: `field_${Date.now()}`,
      label: formatFieldLabel(fieldKey),
      source: fieldKey.startsWith('custom_') ? 'custom' : 'attendee',
      field: fieldKey,
      visible: true,
      fontStyle: { ...DEFAULT_FONT_STYLE, ...preset }
    }

    onFieldsChange([...fields, newField])
  }

  const removeField = (fieldId: string) => {
    onFieldsChange(fields.filter(f => f.id !== fieldId))
  }

  const updateField = (fieldId: string, updates: Partial<BadgeField>) => {
    onFieldsChange(fields.map(f => 
      f.id === fieldId ? { ...f, ...updates } : f
    ))
  }

  const toggleFieldVisibility = (fieldId: string) => {
    updateField(fieldId, { visible: !fields.find(f => f.id === fieldId)?.visible })
  }

  const updateFieldFont = (fieldId: string, fontStyle: FontStyle) => {
    updateField(fieldId, { fontStyle })
  }

  const unusedFields = availableFields.filter(field => 
    !fields.some(f => f.field === field)
  )

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Badge Field Configuration</h3>
        
        {unusedFields.length > 0 && (
          <div className="relative">
            <select
              onChange={(e) => {
                if (e.target.value) {
                  addField(e.target.value)
                  e.target.value = ''
                }
              }}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">+ Add Field</option>
              {unusedFields.map(field => (
                <option key={field} value={field}>
                  {formatFieldLabel(field)}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {fields.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No badge fields configured.</p>
          <p className="text-sm">Use the dropdown above to add fields.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.id} className="border border-gray-200 rounded-lg">
              <div className="p-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setExpandedField(expandedField === field.id ? null : field.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className={`w-4 h-4 transform transition-transform ${expandedField === field.id ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={field.visible}
                      onChange={() => toggleFieldVisibility(field.id)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="font-medium text-gray-900">{field.label}</span>
                    <span className="text-xs text-gray-500">({field.field})</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <div 
                    className="text-xs px-2 py-1 rounded"
                    style={{ 
                      fontFamily: field.fontStyle.fontFamily,
                      fontSize: '10px',
                      color: field.fontStyle.color,
                      backgroundColor: field.fontStyle.color === '#ffffff' ? '#000000' : '#f9f9f9'
                    }}
                  >
                    {field.fontStyle.fontSize}px {field.fontStyle.fontFamily}
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => removeField(field.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>

              {expandedField === field.id && (
                <div className="p-4 bg-white">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Display Label
                      </label>
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => updateField(field.id, { label: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Visibility
                      </label>
                      <select
                        value={field.visible ? 'visible' : 'hidden'}
                        onChange={(e) => updateField(field.id, { visible: e.target.value === 'visible' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="visible">Visible</option>
                        <option value="hidden">Hidden</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-4">
                    <FontPicker
                      fontStyle={field.fontStyle}
                      onChange={(fontStyle) => updateFieldFont(field.id, fontStyle)}
                      label={`Font Settings for ${field.label}`}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}