'use client'

import { useState, useEffect } from 'react'
import type { FontStyle } from '@/types/config'
import { POPULAR_FONTS, FONT_WEIGHTS, FONT_SIZES, loadGoogleFont, getFontStack } from '@/lib/googleFonts'

interface FontPickerProps {
  fontStyle: FontStyle
  onChange: (fontStyle: FontStyle) => void
  label?: string
}

export default function FontPicker({ fontStyle, onChange, label }: FontPickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Load the selected font
  useEffect(() => {
    if (fontStyle.fontFamily && POPULAR_FONTS.includes(fontStyle.fontFamily)) {
      loadGoogleFont(fontStyle.fontFamily, [fontStyle.fontWeight, '400', '700'])
    }
  }, [fontStyle.fontFamily, fontStyle.fontWeight])

  const handleFontChange = (field: keyof FontStyle, value: any) => {
    const updatedStyle = { ...fontStyle, [field]: value }
    onChange(updatedStyle)
  }

  const handleFontFamilyChange = (fontFamily: string) => {
    loadGoogleFont(fontFamily, [fontStyle.fontWeight, '400', '700'])
    handleFontChange('fontFamily', fontFamily)
  }

  return (
    <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-white">
      {label && (
        <h3 className="text-sm font-medium text-gray-900">{label}</h3>
      )}

      {/* Font Family */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Font Family
        </label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full px-3 py-2 text-left border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            style={{ fontFamily: getFontStack(fontStyle.fontFamily) }}
          >
            {fontStyle.fontFamily}
          </button>
          
          {isOpen && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {POPULAR_FONTS.map((font) => (
                <button
                  key={font}
                  type="button"
                  onClick={() => {
                    handleFontFamilyChange(font)
                    setIsOpen(false)
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                  style={{ fontFamily: getFontStack(font) }}
                >
                  {font}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Font Size */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Size
          </label>
          <select
            value={fontStyle.fontSize}
            onChange={(e) => handleFontChange('fontSize', parseInt(e.target.value))}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {FONT_SIZES.map((size) => (
              <option key={size.value} value={size.value}>
                {size.label}
              </option>
            ))}
          </select>
        </div>

        {/* Font Weight */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Weight
          </label>
          <select
            value={fontStyle.fontWeight}
            onChange={(e) => handleFontChange('fontWeight', e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {FONT_WEIGHTS.map((weight) => (
              <option key={weight.value} value={weight.value}>
                {weight.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Color and Text Align */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Color
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="color"
              value={fontStyle.color}
              onChange={(e) => handleFontChange('color', e.target.value)}
              className="w-8 h-6 border border-gray-300 rounded cursor-pointer"
            />
            <input
              type="text"
              value={fontStyle.color}
              onChange={(e) => handleFontChange('color', e.target.value)}
              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="#000000"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Align
          </label>
          <select
            value={fontStyle.textAlign || 'left'}
            onChange={(e) => handleFontChange('textAlign', e.target.value as 'left' | 'center' | 'right')}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </div>
      </div>

      {/* Preview */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Preview
        </label>
        <div 
          className="p-3 border border-gray-200 rounded bg-gray-50"
          style={{
            fontFamily: getFontStack(fontStyle.fontFamily),
            fontSize: `${fontStyle.fontSize}px`,
            fontWeight: fontStyle.fontWeight,
            color: fontStyle.color,
            textAlign: fontStyle.textAlign || 'left',
            lineHeight: fontStyle.lineHeight || 1.4
          }}
        >
          Sample Badge Text
        </div>
      </div>
    </div>
  )
}