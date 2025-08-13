'use client'

import { useState, useEffect } from 'react'
import type { Template } from '@/types/config'
import { ISO_PAGE_SIZES, DEFAULT_PAGE_SIZE } from '@/lib/pageSizes'
import TemplateEditor from './TemplateEditor'

interface TemplateManagerProps {
  eventId?: string
}

export default function TemplateManager({ eventId }: TemplateManagerProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [isNewTemplate, setIsNewTemplate] = useState(false)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const url = eventId ? `/api/templates?eventId=${eventId}` : '/api/templates'
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch templates')
      }
      
      const data = await response.json()
      setTemplates(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTemplate = () => {
    // Use UUID for event templates, timestamp-based ID for global templates
    const templateId = eventId 
      ? crypto.randomUUID() 
      : `template_${Date.now()}`
    
    const newTemplate: Template = {
      id: templateId,
      name: 'New Template',
      description: '',
      pageSize: DEFAULT_PAGE_SIZE,
      backgroundColor: '#ffffff',
      bleed: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    setEditingTemplate(newTemplate)
    setIsNewTemplate(true)
    setShowEditor(true)
  }

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template)
    setIsNewTemplate(false)
    setShowEditor(true)
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return
    }

    try {
      const url = eventId ? `/api/templates?id=${templateId}&eventId=${eventId}` : `/api/templates?id=${templateId}`
      const response = await fetch(url, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete template')
      }

      await fetchTemplates()
    } catch (error) {
      console.error('Error deleting template:', error)
      alert('Failed to delete template')
    }
  }

  const handleSaveTemplate = async () => {
    await fetchTemplates()
    setShowEditor(false)
    setEditingTemplate(null)
    setIsNewTemplate(false)
  }

  if (showEditor) {
    return (
      <TemplateEditor
        template={isNewTemplate ? null : editingTemplate}
        initialData={editingTemplate}
        eventId={eventId}
        onSave={handleSaveTemplate}
        onCancel={() => {
          setShowEditor(false)
          setEditingTemplate(null)
          setIsNewTemplate(false)
        }}
      />
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Template Manager</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create and manage badge templates with custom layouts and designs
          </p>
        </div>
        <button
          onClick={handleCreateTemplate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
        >
          Create Template
        </button>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={fetchTemplates}
                  className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && (
        <div>
          {templates.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🎨</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No templates yet</h3>
              <p className="text-gray-500 mb-4">
                Create your first template to get started with custom badge designs
              </p>
              <button
                onClick={handleCreateTemplate}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium transition-colors"
              >
                Create Your First Template
              </button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 hover:shadow-md transition-all"
                >
                  <div className="mb-4">
                    <h3 className="font-medium text-gray-900 mb-1">{template.name}</h3>
                    {template.description && (
                      <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                    )}
                    <div className="text-sm text-gray-500 space-y-1">
                      <p><strong>Page Size:</strong> {template.pageSize.name}</p>
                      <p><strong>Bleed:</strong> {template.bleed}mm</p>
                      {template.backgroundImage && (
                        <p><strong>Background:</strong> Custom image</p>
                      )}
                      {template.backgroundColor && !template.backgroundImage && (
                        <p><strong>Background:</strong> 
                          <span 
                            className="inline-block w-4 h-4 rounded ml-2 border"
                            style={{ backgroundColor: template.backgroundColor }}
                          />
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditTemplate(template)}
                      className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-100 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="flex-1 bg-red-50 text-red-600 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-100 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}