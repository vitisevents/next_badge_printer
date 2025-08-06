import { NextRequest, NextResponse } from 'next/server'

const API_BASE = 'https://api.tickettailor.com/v1'

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.TT_APIKEY
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('event_id')
    
    if (!eventId) {
      return NextResponse.json({ error: 'event_id is required' }, { status: 400 })
    }

    // Get ticket types from orders data for this event
    const response = await fetch(`${API_BASE}/orders`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch orders: ${response.statusText}`)
    }

    const ordersData = await response.json()
    const orders = ordersData.data || []
    
    // Extract ticket types from orders for the specified event
    const ticketTypesMap = new Map()
    
    orders.forEach((order: any) => {
      if (order.event_summary?.event_id === eventId && order.issued_tickets) {
        order.issued_tickets.forEach((ticket: any) => {
          if (ticket.ticket_type_id) {
            // Generate a color based on the ticket type ID for consistency
            const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316']
            const colorIndex = parseInt(ticket.ticket_type_id.slice(-1), 16) % colors.length
            
            ticketTypesMap.set(ticket.ticket_type_id, {
              id: ticket.ticket_type_id,
              name: ticket.description || 'Unknown Ticket Type',
              colour: colors[colorIndex],
              price: 0, // We could extract this from line_items if needed
              description: ticket.description || ''
            })
          }
        })
      }
    })
    
    const ticketTypes = Array.from(ticketTypesMap.values())
    console.log(`Found ${ticketTypes.length} ticket types for event ${eventId}`)
    
    return NextResponse.json(ticketTypes)
  } catch (error) {
    console.error('Error fetching ticket types:', error)
    return NextResponse.json({ error: 'Failed to fetch ticket types' }, { status: 500 })
  }
}