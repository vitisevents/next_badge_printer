'use client'

import { useState, useRef } from 'react'
import type { Template } from '@/types/config'
import { ISO_PAGE_SIZES } from '@/lib/pageSizes'

interface TemplateEditorProps {
  template: Template | null
  onSave: () => void
  onCancel: () => void
}

export default function TemplateEditor({ template, onSave, onCancel }: TemplateEditorProps) {
  const [formData, setFormData] = useState<Template>(template || {
    id: `template_${Date.now()}`,
    name: 'New Template',
    description: '',
    pageSize: ISO_PAGE_SIZES[0],
    backgroundColor: '#ffffff',
    bleed: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })
  
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(formData.backgroundImage || null)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleInputChange = (field: keyof Template, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handlePageSizeChange = (pageSizeId: string) => {
    const pageSize = ISO_PAGE_SIZES.find(ps => ps.id === pageSizeId)
    if (pageSize) {
      handleInputChange('pageSize', pageSize)
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const isImage = file.type.startsWith('image/')
      
      if (!isImage) {
        alert('Please select a valid image file (JPG, PNG, WebP, or SVG)')
        return
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB')
        return
      }

      setSelectedImage(file)
      
      // Create preview for image
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    handleInputChange('backgroundImage', undefined)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      const formDataToSend = new FormData()
      formDataToSend.append('template', JSON.stringify(formData))
      
      if (selectedImage) {
        formDataToSend.append('image', selectedImage)
      }

      const url = template ? '/api/templates' : '/api/templates'
      const method = template ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        body: formDataToSend
      })

      if (!response.ok) {
        throw new Error('Failed to save template')
      }

      onSave()
    } catch (error) {
      console.error('Error saving template:', error)
      alert('Failed to save template')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {template ? 'Edit Template' : 'Create Template'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Configure the layout, size, and background for your badge template
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-md font-medium transition-colors"
          >
            {saving ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Configuration Panel */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Settings</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter template name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Optional description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Page Size
                </label>
                <select
                  value={formData.pageSize.id}
                  onChange={(e) => handlePageSizeChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {ISO_PAGE_SIZES.map(size => (
                    <option key={size.id} value={size.id}>
                      {size.name} ({size.width}mm × {size.height}mm)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bleed (mm)
                </label>
                <input
                  type="number"
                  value={formData.bleed}
                  onChange={(e) => handleInputChange('bleed', parseFloat(e.target.value) || 0)}
                  min="0"
                  max="10"
                  step="0.5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Extra space around the edge for printing bleed
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Background</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Background Image
                </label>
                <div className="space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml"
                    onChange={handleImageUpload}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500">
                    Upload JPG, PNG, WebP, or SVG file. Images will scale to fit using cover mode. For best results, use high-resolution images.
                  </p>
                  <div className="text-xs bg-blue-50 border border-blue-200 rounded p-2 mt-2">
                    <strong>💡 Tip:</strong> To use PDF designs, convert them to high-resolution PNG or JPG images first. 
                    Many PDF converters and design tools can export to image formats.
                  </div>
                  {imagePreview && (
                    <div className="relative inline-block">
                      <img
                        src={imagePreview}
                        alt="Background preview"
                        className="w-32 h-24 object-cover rounded border"
                      />
                      <button
                        onClick={handleRemoveImage}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Background Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={formData.backgroundColor || '#ffffff'}
                    onChange={(e) => handleInputChange('backgroundColor', e.target.value)}
                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.backgroundColor || '#ffffff'}
                    onChange={(e) => handleInputChange('backgroundColor', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="#ffffff"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Used when no background image is set
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Preview</h2>
            
            <div className="flex justify-center">
              <div
                className="border-2 border-dashed border-gray-300 flex items-center justify-center relative"
                style={{
                  width: `${Math.min(formData.pageSize.width * 2, 300)}px`,
                  height: `${Math.min(formData.pageSize.height * 2, 400)}px`,
                  backgroundColor: formData.backgroundColor || '#ffffff',
                  backgroundImage: imagePreview ? `url(${imagePreview})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                {/* Bleed indicators */}
                {formData.bleed > 0 && (
                  <div
                    className="absolute border border-red-300 border-dashed"
                    style={{
                      top: `${formData.bleed * 2}px`,
                      left: `${formData.bleed * 2}px`,
                      right: `${formData.bleed * 2}px`,
                      bottom: `${formData.bleed * 2}px`
                    }}
                  />
                )}
                
                <div className="text-center p-4">
                  <div className="bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm">
                    Sample Badge Content
                  </div>
                  <div className="mt-2 text-xs text-gray-600">
                    {formData.pageSize.name} ({formData.pageSize.width}×{formData.pageSize.height}mm)
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 text-sm text-gray-500 space-y-1">
              <p><strong>Size:</strong> {formData.pageSize.name}</p>
              <p><strong>Dimensions:</strong> {formData.pageSize.width}mm × {formData.pageSize.height}mm</p>
              <p><strong>Bleed:</strong> {formData.bleed}mm</p>
              {formData.bleed > 0 && (
                <p className="text-red-600"><strong>Red dashed line:</strong> Print safe area</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}