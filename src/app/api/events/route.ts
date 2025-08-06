import { NextResponse } from 'next/server'

const API_BASE = 'https://api.tickettailor.com/v1'

export async function GET() {
  try {
    const apiKey = process.env.TT_APIKEY
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
    }

    const authString = `${apiKey}:`
    const authEncoded = Buffer.from(authString).toString('base64')

    // Since we don't have direct access to /events, we'll extract events from orders
    const response = await fetch(`${API_BASE}/orders`, {
      headers: {
        'Authorization': `Basic ${authEncoded}`,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('TicketTailor API Error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        headers: Object.fromEntries(response.headers.entries())
      })
      throw new Error(`Failed to fetch orders: ${response.status} ${response.statusText}`)
    }

    const ordersData = await response.json()
    const orders = ordersData.data || []
    
    // Extract unique events from orders
    const eventsMap = new Map()
    
    orders.forEach((order: any) => {
      if (order.event_summary) {
        const event = order.event_summary
        eventsMap.set(event.event_id, {
          id: event.event_id,
          name: event.name,
          description: `Event at ${event.venue?.name || 'venue TBD'}`,
          start_date: event.start_date.iso,
          end_date: event.end_date.iso,
          venue: {
            name: event.venue?.name || 'Venue TBD',
            postal_address: event.venue?.postal_code || ''
          }
        })
      }
    })
    
    const events = Array.from(eventsMap.values())
    console.log(`Found ${events.length} unique events from ${orders.length} orders`)
    
    return NextResponse.json(events)
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}