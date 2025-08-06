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
    
    // Filter by event if eventId is provided
    const filteredOrders = eventId 
      ? orders.filter((order: any) => order.event_summary?.event_id === eventId)
      : orders
    
    console.log(`Found ${filteredOrders.length} orders for event ${eventId || 'all'}`)
    
    return NextResponse.json(filteredOrders)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}