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
    
    // Fetch all orders with pagination
    let allOrders: any[] = []
    let page = 1
    let hasMore = true
    
    while (hasMore) {
      // TicketTailor doesn't support event_id filter in orders endpoint
      // Use offset for pagination instead of page
      const offset = (page - 1) * 100
      const url = `${API_BASE}/orders?limit=100&offset=${offset}`
        
      const response = await fetch(url, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`,
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.statusText}`)
      }

      const ordersData = await response.json()
      const pageOrders = ordersData.data || []
      
      // Filter orders by event if eventId is provided
      const filteredPageOrders = eventId 
        ? pageOrders.filter((order: any) => order.event_summary?.event_id === eventId)
        : pageOrders
      
      allOrders = allOrders.concat(filteredPageOrders)
      
      // Check if there are more pages
      hasMore = ordersData.links?.next ? true : false
      page++
      
      console.log(`Fetched page ${page - 1}, got ${pageOrders.length} orders (${filteredPageOrders.length} for event), total: ${allOrders.length}`)
      
      // Safety check to prevent infinite loops
      if (page > 20) {
        console.warn('Reached maximum pagination limit')
        break
      }
    }
    
    const filteredOrders = allOrders
    
    console.log(`Found ${filteredOrders.length} orders for event ${eventId || 'all'}`)
    
    return NextResponse.json(filteredOrders)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}