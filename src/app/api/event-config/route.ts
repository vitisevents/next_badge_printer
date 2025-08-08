import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import type { EventConfiguration } from '@/types/config'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')
    
    if (eventId) {
      // Get specific event configuration
      const { data: config, error } = await supabase
        .from('event_configurations')
        .select('*')
        .eq('event_id', eventId)
        .single()
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error fetching event config:', error)
        return NextResponse.json({ error: 'Failed to fetch event configuration' }, { status: 500 })
      }
      
      if (!config) {
        return NextResponse.json(null)
      }
      
      // Transform database format to frontend format
      const eventConfig: EventConfiguration = {
        eventId: config.event_id,
        eventName: config.event_name || '',
        ticketTypeColors: config.ticket_type_colors || {},
        ticketTypeNames: config.ticket_type_names || {},
        customFields: config.custom_fields || [],
        badgeFields: config.badge_fields || [],
        updatedAt: config.updated_at
      }
      
      return NextResponse.json(eventConfig)
    } else {
      // List all event configurations
      const { data: configs, error } = await supabase
        .from('event_configurations')
        .select('*')
        .order('updated_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching event configurations:', error)
        return NextResponse.json({ error: 'Failed to fetch event configurations' }, { status: 500 })
      }
      
      // Transform to frontend format
      const eventConfigs: EventConfiguration[] = configs.map(config => ({
        eventId: config.event_id,
        eventName: config.event_name || '',
        ticketTypeColors: config.ticket_type_colors || {},
        ticketTypeNames: config.ticket_type_names || {},
        customFields: config.custom_fields || [],
        badgeFields: config.badge_fields || [],
        updatedAt: config.updated_at
      }))
      
      return NextResponse.json(eventConfigs)
    }
  } catch (error) {
    console.error('Error fetching event configurations:', error)
    return NextResponse.json({ error: 'Failed to fetch event configurations' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const config: EventConfiguration = await request.json()
    
    // Upsert (insert or update) the configuration
    const { data, error } = await supabaseAdmin
      .from('event_configurations')
      .upsert({
        event_id: config.eventId,
        event_name: config.eventName || '',
        ticket_type_colors: config.ticketTypeColors || {},
        ticket_type_names: config.ticketTypeNames || {},
        custom_fields: config.customFields || [],
        badge_fields: config.badgeFields || [],
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'event_id'
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error saving event configuration:', error)
      return NextResponse.json({ error: 'Failed to save event configuration' }, { status: 500 })
    }
    
    // Transform back to frontend format
    const savedConfig: EventConfiguration = {
      eventId: data.event_id,
      eventName: data.event_name || '',
      ticketTypeColors: data.ticket_type_colors || {},
      ticketTypeNames: data.ticket_type_names || {},
      customFields: data.custom_fields || [],
      badgeFields: data.badge_fields || [],
      updatedAt: data.updated_at
    }
    
    return NextResponse.json(savedConfig)
  } catch (error) {
    console.error('Error saving event configuration:', error)
    return NextResponse.json({ error: 'Failed to save event configuration' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')
    
    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 })
    }
    
    // Delete event configuration from database
    const { error } = await supabaseAdmin
      .from('event_configurations')
      .delete()
      .eq('event_id', eventId)
    
    if (error) {
      console.error('Error deleting event configuration:', error)
      return NextResponse.json({ error: 'Failed to delete event configuration' }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting event configuration:', error)
    return NextResponse.json({ error: 'Failed to delete event configuration' }, { status: 500 })
  }
}