import { NextRequest, NextResponse } from 'next/server'
import { put, list, del } from '@vercel/blob'
import type { Template } from '@/types/config'

export async function GET() {
  try {
    // List all template configurations from blob storage
    const { blobs } = await list({ prefix: 'templates/config/' })
    
    const templates: Template[] = []
    
    for (const blob of blobs) {
      try {
        const response = await fetch(blob.url)
        const template = await response.json()
        templates.push(template)
      } catch (error) {
        console.error('Error fetching template:', blob.pathname, error)
      }
    }
    
    return NextResponse.json(templates)
  } catch (error) {
    console.error('Error listing templates:', error)
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const templateData = JSON.parse(formData.get('template') as string)
    const imageFile = formData.get('image') as File | null
    
    let backgroundImageUrl = templateData.backgroundImage
    
    // Upload image to blob storage if provided
    if (imageFile) {
      const imageBlob = await put(`templates/images/${templateData.id}.${imageFile.name.split('.').pop()}`, imageFile, {
        access: 'public',
      })
      backgroundImageUrl = imageBlob.url
    }
    
    const template: Template = {
      ...templateData,
      backgroundImage: backgroundImageUrl,
      updatedAt: new Date().toISOString()
    }
    
    // Save template configuration to blob storage
    const configBlob = await put(`templates/config/${template.id}.json`, JSON.stringify(template), {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false
    })
    
    return NextResponse.json(template)
  } catch (error) {
    console.error('Error creating template:', error)
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const formData = await request.formData()
    const templateData = JSON.parse(formData.get('template') as string)
    const imageFile = formData.get('image') as File | null
    
    let backgroundImageUrl = templateData.backgroundImage
    
    // Upload new image if provided
    if (imageFile) {
      // Delete old image first if it exists
      try {
        const { blobs } = await list({ prefix: `templates/images/${templateData.id}.` })
        if (blobs.length > 0) {
          await del(blobs.map(blob => blob.url))
        }
      } catch (deleteError) {
        console.warn('Could not delete old image:', deleteError)
      }
      
      const imageBlob = await put(`templates/images/${templateData.id}.${imageFile.name.split('.').pop()}`, imageFile, {
        access: 'public',
      })
      backgroundImageUrl = imageBlob.url
    }
    
    const template: Template = {
      ...templateData,
      backgroundImage: backgroundImageUrl,
      updatedAt: new Date().toISOString()
    }
    
    // Delete existing config and create new one
    try {
      await del([`templates/config/${template.id}.json`])
    } catch (deleteError) {
      console.warn('Could not delete existing config:', deleteError)
    }
    
    // Create new template configuration
    const configBlob = await put(`templates/config/${template.id}.json`, JSON.stringify(template), {
      access: 'public',
      contentType: 'application/json',
    })
    
    return NextResponse.json(template)
  } catch (error) {
    console.error('Error updating template:', error)
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('id')
    
    if (!templateId) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 })
    }
    
    // Delete template configuration and image
    await del([`templates/config/${templateId}.json`])
    
    // Try to delete associated images (we don't know the exact filename)
    const { blobs } = await list({ prefix: `templates/images/${templateId}.` })
    if (blobs.length > 0) {
      await del(blobs.map(blob => blob.url))
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting template:', error)
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 })
  }
}