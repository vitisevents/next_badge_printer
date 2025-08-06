import { NextRequest, NextResponse } from 'next/server'
import { put, list, del } from '@vercel/blob'
import type { EventConfiguration } from '@/types/config'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')
    
    if (eventId) {
      // Get specific event configuration
      try {
        const { blobs } = await list({ prefix: `events/config/${eventId}.json` })
        if (blobs.length > 0) {
          const response = await fetch(blobs[0].url)
          const config = await response.json()
          return NextResponse.json(config)
        } else {
          return NextResponse.json(null)
        }
      } catch (error) {
        return NextResponse.json(null)
      }
    } else {
      // List all event configurations
      const { blobs } = await list({ prefix: 'events/config/' })
      
      const configs: EventConfiguration[] = []
      
      for (const blob of blobs) {
        try {
          const response = await fetch(blob.url)
          const config = await response.json()
          configs.push(config)
        } catch (error) {
          console.error('Error fetching event config:', blob.pathname, error)
        }
      }
      
      return NextResponse.json(configs)
    }
  } catch (error) {
    console.error('Error fetching event configurations:', error)
    return NextResponse.json({ error: 'Failed to fetch event configurations' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const config: EventConfiguration = await request.json()
    
    const configWithTimestamp = {
      ...config,
      updatedAt: new Date().toISOString()
    }
    
    // Save event configuration to blob storage
    const configBlob = await put(
      `events/config/${config.eventId}.json`,
      JSON.stringify(configWithTimestamp),
      {
        access: 'public',
        contentType: 'application/json',
      }
    )
    
    return NextResponse.json(configWithTimestamp)
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
    
    // Delete event configuration
    await del([`events/config/${eventId}.json`])
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting event configuration:', error)
    return NextResponse.json({ error: 'Failed to delete event configuration' }, { status: 500 })
  }
}