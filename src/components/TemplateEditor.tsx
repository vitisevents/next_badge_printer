'use client'

import { useState, useRef } from 'react'
import type { Template } from '@/types/config'
import { ISO_PAGE_SIZES } from '@/lib/pageSizes'

interface TemplateEditorProps {
  template: Template | null  // null = POST (create), not null = PUT (update)
  initialData?: Template | null  // Initial form data
  eventId?: string
  onSave: () => void
  onCancel: () => void
}

export default function TemplateEditor({ template, initialData, eventId, onSave, onCancel }: TemplateEditorProps) {
  const [formData, setFormData] = useState<Template>(() => {
    const dataSource = initialData || template
    if (dataSource) {
      // Ensure existing templates have nameColor and nameFontSize for backward compatibility
      return {
        ...dataSource,
        nameColor: dataSource.nameColor || '#111827',
        nameFontSize: dataSource.nameFontSize || 24,
        displayFields: dataSource.displayFields || ['holder_name']
      }
    }
    
    // Use UUID for event templates, timestamp-based ID for global templates
    const templateId = eventId 
      ? crypto.randomUUID() 
      : `template_${Date.now()}`
    
    return {
      id: templateId,
      name: 'New Template',
      description: '',
      pageSize: ISO_PAGE_SIZES[0],
      backgroundColor: '#ffffff',
      bleed: 3,
      nameColor: '#111827',
      nameFontSize: 24,
      displayFields: ['holder_name'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
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
      
      if (eventId) {
        formDataToSend.append('eventId', eventId)
      }
      
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

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.showEventName !== false}
                    onChange={(e) => handleInputChange('showEventName', e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Show event name on badge</span>
                </label>
                <p className="mt-1 text-xs text-gray-500 ml-6">
                  Display the event name at the top of each badge
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name Font Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={formData.nameColor || '#111827'}
                    onChange={(e) => handleInputChange('nameColor', e.target.value)}
                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.nameColor || '#111827'}
                    onChange={(e) => handleInputChange('nameColor', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="#111827"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Color for the main name text on badges
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name Font Size (px)
                </label>
                <input
                  type="number"
                  value={formData.nameFontSize || 24}
                  onChange={(e) => handleInputChange('nameFontSize', parseFloat(e.target.value) || 24)}
                  min="12"
                  max="48"
                  step="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Font size for the main name text (12-48px)
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

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Badge Content</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Display Fields
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Choose which fields to display on badges created with this template
                </p>
                <div className="space-y-2">
                  {[
                    { id: 'holder_name', label: 'Name', required: true },
                    { id: 'job_title', label: 'Job Title', required: false },
                    { id: 'company', label: 'Company', required: false },
                    { id: 'holder_email', label: 'Email Address', required: false }
                  ].map((field) => (
                    <label key={field.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.displayFields?.includes(field.id) || field.required}
                        disabled={field.required}
                        onChange={(e) => {
                          const currentFields = formData.displayFields || ['holder_name']
                          if (e.target.checked) {
                            handleInputChange('displayFields', [...currentFields, field.id])
                          } else {
                            handleInputChange('displayFields', currentFields.filter(f => f !== field.id))
                          }
                        }}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                      />
                      <span className={`text-sm ${field.required ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                      </span>
                    </label>
                  ))}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Selected fields: {(formData.displayFields || ['holder_name']).join(', ')}
                </p>
              </div>
            </div>
          </div>

          {/* QR Code Settings */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">VCard QR Code</h2>
            
            <div className="space-y-4">
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.qrCode?.showOnFront || false}
                    onChange={(e) => handleInputChange('qrCode', {
                      ...formData.qrCode,
                      showOnFront: e.target.checked,
                      showOnBack: formData.qrCode?.showOnBack || false,
                      position: formData.qrCode?.position || { x: 50, y: 50 },
                      size: formData.qrCode?.size || 20
                    })}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Show on Front</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.qrCode?.showOnBack || false}
                    onChange={(e) => handleInputChange('qrCode', {
                      ...formData.qrCode,
                      showOnFront: formData.qrCode?.showOnFront || false,
                      showOnBack: e.target.checked,
                      position: formData.qrCode?.position || { x: 50, y: 50 },
                      size: formData.qrCode?.size || 20
                    })}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Show on Back</span>
                </label>
              </div>
              
              {(formData.qrCode?.showOnFront || formData.qrCode?.showOnBack) && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      QR Code Size (mm)
                    </label>
                    <input
                      type="number"
                      value={formData.qrCode?.size || 20}
                      onChange={(e) => handleInputChange('qrCode', {
                        ...formData.qrCode,
                        size: parseFloat(e.target.value) || 20
                      })}
                      min="10"
                      max="50"
                      step="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Horizontal Position (%)
                      </label>
                      <input
                        type="range"
                        value={formData.qrCode?.position?.x || 50}
                        onChange={(e) => handleInputChange('qrCode', {
                          ...formData.qrCode,
                          position: {
                            ...formData.qrCode?.position,
                            x: parseFloat(e.target.value),
                            y: formData.qrCode?.position?.y || 50
                          }
                        })}
                        min="0"
                        max="100"
                        className="w-full"
                      />
                      <div className="text-center text-xs text-gray-500 mt-1">
                        {formData.qrCode?.position?.x || 50}%
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Vertical Position (%)
                      </label>
                      <input
                        type="range"
                        value={formData.qrCode?.position?.y || 50}
                        onChange={(e) => handleInputChange('qrCode', {
                          ...formData.qrCode,
                          position: {
                            ...formData.qrCode?.position,
                            x: formData.qrCode?.position?.x || 50,
                            y: parseFloat(e.target.value)
                          }
                        })}
                        min="0"
                        max="100"
                        className="w-full"
                      />
                      <div className="text-center text-xs text-gray-500 mt-1">
                        {formData.qrCode?.position?.y || 50}%
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-500">
                    The QR code will contain VCard data (name, email, job title, company) when available
                  </p>
                </>
              )}
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
                
                {/* QR Code Preview */}
                {(formData.qrCode?.showOnFront || formData.qrCode?.showOnBack) && (
                  <div
                    className="absolute bg-white border-2 border-gray-400 rounded flex items-center justify-center"
                    style={{
                      width: `${(formData.qrCode?.size || 20) * 2}px`,
                      height: `${(formData.qrCode?.size || 20) * 2}px`,
                      left: `${(formData.qrCode?.position?.x || 50)}%`,
                      top: `${(formData.qrCode?.position?.y || 50)}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    <div className="text-xs text-gray-500">QR</div>
                  </div>
                )}
                
                <div className="text-center p-4">
                  <div 
                    className="font-bold mb-2 leading-tight"
                    style={{ 
                      color: formData.nameColor || '#111827',
                      fontSize: `${(formData.nameFontSize || 24) / 2}px` // Scale down for preview
                    }}
                  >
                    Christopher Alexander-Smith Jr.
                  </div>
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