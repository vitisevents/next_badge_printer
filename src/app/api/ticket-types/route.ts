import { NextRequest, NextResponse } from 'next/server'
import { writeFileSync } from 'fs'
import { join } from 'path'

const API_BASE = 'https://api.tickettailor.com/v1'

export async function GET(request: NextRequest) {
  try {
    // Try to get API key from header first, fallback to environment variable
    const apiKey = request.headers.get('X-API-Key') || process.env.TT_APIKEY
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('event_id')
    
    if (!eventId) {
      return NextResponse.json({ error: 'event_id is required' }, { status: 400 })
    }

    // Debug log
    const debugLog: any[] = []
    debugLog.push({
      timestamp: new Date().toISOString(),
      message: 'Starting ticket-types fetch',
      eventId
    })

    // Try to get ticket types from the event's ticket types endpoint
    // First, let's try the events endpoint to get ticket types
    const eventResponse = await fetch(`${API_BASE}/events/${eventId}/ticket_types`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`,
        'Accept': 'application/json'
      }
    })

    debugLog.push({
      message: 'Direct ticket types endpoint response',
      status: eventResponse.status,
      ok: eventResponse.ok
    })

    if (eventResponse.ok) {
      const data = await eventResponse.json()
      const ticketTypes = data.data || []
      
      debugLog.push({
        message: 'Got ticket types from direct endpoint',
        count: ticketTypes.length,
        ticketTypes
      })
      
      // Add consistent colors for ticket types that might not have them
      const enhancedTicketTypes = ticketTypes.map((ticketType: any, index: number) => {
        const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316']
        const colorIndex = ticketType.id ? parseInt(ticketType.id.slice(-1), 16) % colors.length : index % colors.length
        
        return {
          id: ticketType.id,
          name: ticketType.name || ticketType.title || 'Unnamed Ticket Type',
          colour: ticketType.colour || colors[colorIndex],
          price: ticketType.price || 0,
          description: ticketType.description || ticketType.name || ''
        }
      })
      
      console.log(`Found ${enhancedTicketTypes.length} ticket types for event ${eventId}`)
      
      // Write debug log (development only)
      if (process.env.NODE_ENV === 'development') {
        try {
          const logPath = join(process.cwd(), 'debug-ticket-types.log')
          writeFileSync(logPath, JSON.stringify(debugLog, null, 2))
          console.log('Debug log written to:', logPath)
        } catch (err) {
          console.error('Failed to write debug log:', err)
        }
      } else {
        console.log('Debug log (production):', JSON.stringify(debugLog.slice(-1)[0], null, 2))
      }
      
      return NextResponse.json(enhancedTicketTypes)
    }

    // If that doesn't work, fall back to extracting from orders
    console.log('Direct ticket types endpoint failed, extracting from orders...')
    debugLog.push({
      message: 'Falling back to extracting from orders'
    })
    
    // Fetch ALL orders using cursor pagination to get ALL ticket types
    let allOrders: any[] = []
    let lastOrderId: string | null = null
    let hasMore = true
    let pageCount = 0
    
    while (hasMore) {
      const url: string = lastOrderId 
        ? `${API_BASE}/orders?limit=100&starting_after=${lastOrderId}`
        : `${API_BASE}/orders?limit=100`
        
      const response = await fetch(url, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`,
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        console.error(`TicketTailor API error: ${response.status} ${response.statusText}`)
        throw new Error(`Failed to fetch ticket types: ${response.statusText}`)
      }

      const data = await response.json()
      const pageOrders = data.data || []
      
      // Filter for this event's orders
      const eventOrders = pageOrders.filter((order: any) => 
        order.event_summary?.event_id === eventId
      )
      
      allOrders = allOrders.concat(eventOrders)
      
      // Update lastOrderId for next page
      if (pageOrders.length > 0) {
        lastOrderId = pageOrders[pageOrders.length - 1].id
      }
      
      hasMore = data.links?.next ? true : false
      pageCount++
      
      // Stop if no orders on this page or too many pages
      if (pageOrders.length === 0 || pageCount > 50) {
        break
      }
    }
    
    const orders = allOrders
    
    // Extract unique ticket types from orders
    const ticketTypesMap = new Map<string, any>()
    
    orders.forEach((order: any) => {
      if (order.issued_tickets) {
        order.issued_tickets.forEach((ticket: any) => {
          if (ticket.ticket_type_id && !ticketTypesMap.has(ticket.ticket_type_id)) {
            // Use ticket description as the name since ticket_type_name doesn't exist
            const ticketName = ticket.description || ticket.ticket_type_name || 'General Admission'
            
            // Assign colors based on ticket type ID
            const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316']
            const colorIndex = parseInt(ticket.ticket_type_id.replace(/[^0-9]/g, '').slice(-1) || '0') % colors.length
            
            ticketTypesMap.set(ticket.ticket_type_id, {
              id: ticket.ticket_type_id,
              name: ticketName,
              colour: ticket.ticket_type_colour || colors[colorIndex],
              price: ticket.ticket_type_price || 0,
              description: ticketName
            })
          }
        })
      }
    })
    
    // If no ticket types found from orders, create a default set
    if (ticketTypesMap.size === 0) {
      console.log('No ticket types found in orders, creating default ticket types')
      // Create some default ticket types for the event
      const defaultTypes = [
        { id: `${eventId}_general`, name: 'General Admission', colour: '#3B82F6', price: 0, description: 'General admission ticket' },
        { id: `${eventId}_vip`, name: 'VIP', colour: '#8B5CF6', price: 0, description: 'VIP ticket' },
        { id: `${eventId}_sponsor`, name: 'Sponsor', colour: '#10B981', price: 0, description: 'Sponsor ticket' }
      ]
      return NextResponse.json(defaultTypes)
    }
    
    const enhancedTicketTypes = Array.from(ticketTypesMap.values())
    console.log(`Found ${enhancedTicketTypes.length} ticket types from orders for event ${eventId}`)
    
    debugLog.push({
      message: 'Extracted ticket types from orders',
      count: enhancedTicketTypes.length,
      ticketTypes: enhancedTicketTypes
    })
    
    // Write debug log (development only)
    if (process.env.NODE_ENV === 'development') {
      try {
        const logPath = join(process.cwd(), 'debug-ticket-types.log')
        writeFileSync(logPath, JSON.stringify(debugLog, null, 2))
        console.log('Debug log written to:', logPath)
      } catch (err) {
        console.error('Failed to write debug log:', err)
      }
    } else {
      console.log('Debug log (production):', JSON.stringify(debugLog.slice(-1)[0], null, 2))
    }
    
    return NextResponse.json(enhancedTicketTypes)
  } catch (error) {
    console.error('Error fetching ticket types:', error)
    return NextResponse.json({ error: 'Failed to fetch ticket types' }, { status: 500 })
  }
}