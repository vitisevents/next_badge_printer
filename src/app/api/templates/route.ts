import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import type { Template } from '@/types/config'

export async function GET() {
  try {
    const { data: templates, error } = await supabase
      .from('templates')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching templates:', error)
      return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
    }

    // Transform database format to frontend format
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
      qrCode: t.qr_code_settings,
      createdAt: t.created_at,
      updatedAt: t.updated_at
    }))

    return NextResponse.json(transformedTemplates)
  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const templateData = JSON.parse(formData.get('template') as string)
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
    
    // Save template to database
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
        qr_code_settings: templateData.qrCode || null
      })
    
    if (dbError) {
      console.error('Error saving template to database:', dbError)
      throw dbError
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
    
    // Update template in database
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
        qr_code_settings: templateData.qrCode || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', templateData.id)
    
    if (dbError) {
      console.error('Error updating template in database:', dbError)
      throw dbError
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
    
    if (!templateId) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 })
    }
    
    // Delete template from database
    const { error: dbError } = await supabase
      .from('templates')
      .delete()
      .eq('id', templateId)
    
    if (dbError) {
      console.error('Error deleting template from database:', dbError)
      throw dbError
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