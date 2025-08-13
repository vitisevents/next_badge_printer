import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import type { Template } from '@/types/config'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')

    let templates
    let error

    if (eventId) {
      // Fetch event-specific templates
      const result = await supabase
        .from('event_templates')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })
      
      templates = result.data
      error = result.error

      // Transform event_templates format to frontend format
      if (templates && !error) {
        const transformedTemplates: Template[] = templates.map(t => {
          const templateData = t.template_data
          return {
            id: t.id, // Use the database UUID as the ID
            name: t.name,
            description: templateData.description || '',
            pageSize: templateData.pageSize || templateData.page_size,
            backgroundColor: templateData.backgroundColor || templateData.background_color || '#ffffff',
            backgroundImage: templateData.backgroundImage || templateData.background_image_url,
            bleed: templateData.bleed || 0,
            nameColor: templateData.nameColor || templateData.name_color || '#111827',
            nameFontSize: templateData.nameFontSize || templateData.name_font_size || 24,
            showEventName: templateData.showEventName ?? templateData.show_event_name ?? true,
            displayFields: templateData.displayFields || templateData.display_fields || ['holder_name'],
            qrCode: templateData.qrCode || templateData.qr_code_settings,
            createdAt: t.created_at,
            updatedAt: t.updated_at
          }
        })
        return NextResponse.json(transformedTemplates)
      }
    } else {
      // Fetch global templates (backward compatibility)
      const result = await supabase
        .from('templates')
        .select('*')
        .order('created_at', { ascending: false })
      
      templates = result.data
      error = result.error

      // Transform database format to frontend format
      if (templates && !error) {
        const transformedTemplates: Template[] = templates.map(t => ({
          id: t.id,
          name: t.name,
          description: t.description,
          pageSize: t.page_size,
          backgroundColor: t.background_color,
          backgroundImage: t.background_image_url,
          bleed: t.bleed,
          nameColor: t.name_color,
          nameFontSize: t.name_font_size,
          showEventName: t.show_event_name,
          displayFields: t.display_fields || ['holder_name'],
          qrCode: t.qr_code_settings,
          createdAt: t.created_at,
          updatedAt: t.updated_at
        }))
        return NextResponse.json(transformedTemplates)
      }
    }

    if (error) {
      console.error('Error fetching templates:', error)
      return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
    }

    return NextResponse.json([])
  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const templateData = JSON.parse(formData.get('template') as string)
    const eventId = formData.get('eventId') as string
    const imageFile = formData.get('image') as File | null
    
    let backgroundImageUrl = templateData.backgroundImage
    
    // Upload image to Supabase storage if provided
    if (imageFile) {
      const imageBuffer = await imageFile.arrayBuffer()
      const { data, error } = await supabase.storage
        .from('template-images')
        .upload(`${templateData.id}.${imageFile.name.split('.').pop()}`, imageBuffer, {
          contentType: imageFile.type,
          upsert: true
        })
      
      if (error) {
        console.error('Error uploading image:', error)
        throw error
      }
      
      // Get public URL
      const { data: publicData } = supabase.storage
        .from('template-images')
        .getPublicUrl(data.path)
      
      backgroundImageUrl = publicData.publicUrl
    }
    
    if (eventId) {
      // Save as event-specific template
      // Generate a proper UUID for event_templates table
      const { data: uuidResult } = await supabase
        .rpc('gen_random_uuid')
      
      const eventTemplateId = uuidResult || crypto.randomUUID()
      
      const templateDataToStore = {
        ...templateData,
        id: eventTemplateId, // Store the UUID in template_data as well
        backgroundImage: backgroundImageUrl
      }
      
      const { error: dbError } = await supabase
        .from('event_templates')
        .insert({
          id: eventTemplateId,
          event_id: eventId,
          name: templateData.name,
          template_data: templateDataToStore
        })
      
      if (dbError) {
        console.error('Error saving event template to database:', dbError)
        throw dbError
      }
      
      // Update templateData with the actual UUID used
      templateData.id = eventTemplateId
    } else {
      // Save as global template (backward compatibility)
      const { error: dbError } = await supabase
        .from('templates')
        .insert({
          id: templateData.id,
          name: templateData.name,
          description: templateData.description,
          page_size: templateData.pageSize,
          background_color: templateData.backgroundColor,
          background_image_url: backgroundImageUrl,
          bleed: templateData.bleed,
          name_color: templateData.nameColor,
          name_font_size: templateData.nameFontSize,
          show_event_name: templateData.showEventName || false,
          display_fields: templateData.displayFields || ['holder_name'],
          qr_code_settings: templateData.qrCode || null
        })
      
      if (dbError) {
        console.error('Error saving template to database:', dbError)
        throw dbError
      }
    }
    
    const template: Template = {
      ...templateData,
      backgroundImage: backgroundImageUrl,
      updatedAt: new Date().toISOString()
    }
    
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
    const eventId = formData.get('eventId') as string
    const imageFile = formData.get('image') as File | null
    
    let backgroundImageUrl = templateData.backgroundImage
    
    // Upload new image if provided
    if (imageFile) {
      // Delete old image first if it exists
      try {
        const { data: files } = await supabase.storage
          .from('template-images')
          .list('', { search: `${templateData.id}.` })
        
        if (files && files.length > 0) {
          const filesToDelete = files.map(file => file.name)
          await supabase.storage
            .from('template-images')
            .remove(filesToDelete)
        }
      } catch (deleteError) {
        console.warn('Could not delete old image:', deleteError)
      }
      
      const imageBuffer = await imageFile.arrayBuffer()
      const { data, error } = await supabase.storage
        .from('template-images')
        .upload(`${templateData.id}.${imageFile.name.split('.').pop()}`, imageBuffer, {
          contentType: imageFile.type,
          upsert: true
        })
      
      if (error) {
        console.error('Error uploading image:', error)
        throw error
      }
      
      // Get public URL
      const { data: publicData } = supabase.storage
        .from('template-images')
        .getPublicUrl(data.path)
      
      backgroundImageUrl = publicData.publicUrl
    }
    
    if (eventId) {
      // Update event-specific template
      const templateDataToStore = {
        ...templateData,
        id: templateData.id, // Preserve the ID in template_data
        backgroundImage: backgroundImageUrl
      }
      
      const { data: updateData, error: dbError, count } = await supabase
        .from('event_templates')
        .update({
          name: templateData.name,
          template_data: templateDataToStore,
          updated_at: new Date().toISOString()
        })
        .eq('id', templateData.id) // This will match against the database UUID
        .select()
      
      if (dbError) {
        console.error('Error updating event template in database:', dbError)
        throw dbError
      }
      
      // If no rows were updated, it means the template doesn't exist, so create it
      if (!updateData || updateData.length === 0) {
        console.log('Template not found for update, creating new one instead')
        
        // Generate a new UUID for the template
        const { data: uuidResult } = await supabase
          .rpc('gen_random_uuid')
        
        const newTemplateId = uuidResult || crypto.randomUUID()
        
        const newTemplateData = {
          ...templateDataToStore,
          id: newTemplateId
        }
        
        const { error: insertError } = await supabase
          .from('event_templates')
          .insert({
            id: newTemplateId,
            event_id: eventId,
            name: templateData.name,
            template_data: newTemplateData
          })
        
        if (insertError) {
          console.error('Error creating event template in database:', insertError)
          throw insertError
        }
        
        templateData.id = newTemplateId
      }
    } else {
      // Update global template (backward compatibility)
      const { error: dbError } = await supabase
        .from('templates')
        .update({
          name: templateData.name,
          description: templateData.description,
          page_size: templateData.pageSize,
          background_color: templateData.backgroundColor,
          background_image_url: backgroundImageUrl,
          bleed: templateData.bleed,
          name_color: templateData.nameColor,
          name_font_size: templateData.nameFontSize,
          show_event_name: templateData.showEventName || false,
          display_fields: templateData.displayFields || ['holder_name'],
          qr_code_settings: templateData.qrCode || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', templateData.id)
      
      if (dbError) {
        console.error('Error updating template in database:', dbError)
        throw dbError
      }
    }
    
    const template: Template = {
      ...templateData,
      backgroundImage: backgroundImageUrl,
      updatedAt: new Date().toISOString()
    }
    
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
    const eventId = searchParams.get('eventId')
    
    if (!templateId) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 })
    }
    
    if (eventId) {
      // Delete event-specific template
      const { error: dbError } = await supabase
        .from('event_templates')
        .delete()
        .eq('id', templateId)
      
      if (dbError) {
        console.error('Error deleting event template from database:', dbError)
        throw dbError
      }
    } else {
      // Delete global template (backward compatibility)
      const { error: dbError } = await supabase
        .from('templates')
        .delete()
        .eq('id', templateId)
      
      if (dbError) {
        console.error('Error deleting template from database:', dbError)
        throw dbError
      }
    }
    
    // Delete associated images from storage
    try {
      const { data: files } = await supabase.storage
        .from('template-images')
        .list('', { search: `${templateId}.` })
      
      if (files && files.length > 0) {
        const filesToDelete = files.map(file => file.name)
        await supabase.storage
          .from('template-images')
          .remove(filesToDelete)
      }
    } catch (storageError) {
      console.warn('Could not delete template images:', storageError)
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting template:', error)
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 })
  }
}