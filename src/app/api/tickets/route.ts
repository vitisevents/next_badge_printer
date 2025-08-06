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

    // Get tickets from orders data for this event
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
    
    // Extract tickets from orders for the specified event
    const tickets: any[] = []
    
    orders.forEach((order: any) => {
      if (order.event_summary?.event_id === eventId && order.issued_tickets) {
        order.issued_tickets.forEach((ticket: any) => {
          // Merge ticket and order custom questions
          const customQuestions: Record<string, string> = {}
          
          // Add ticket-level custom questions
          if (ticket.custom_questions) {
            ticket.custom_questions.forEach((q: any) => {
              if (q.question && q.answer) {
                customQuestions[q.question.toLowerCase().replace(/[^a-z0-9]/g, '_')] = q.answer
              }
            })
          }
          
          // Add order-level custom questions
          if (order.buyer_details.custom_questions) {
            order.buyer_details.custom_questions.forEach((q: any) => {
              if (q.question && q.answer) {
                customQuestions[q.question.toLowerCase().replace(/[^a-z0-9]/g, '_')] = q.answer
              }
            })
          }

          tickets.push({
            id: ticket.id,
            reference: ticket.barcode || ticket.id,
            ticket_type_id: ticket.ticket_type_id,
            holder_name: order.buyer_details.name || `${order.buyer_details.first_name} ${order.buyer_details.last_name}`.trim(),
            holder_email: order.buyer_details.email || ticket.email,
            order_id: order.id,
            custom_fields: customQuestions,
            ticket_description: ticket.description,
            order_reference: order.reference || order.id,
            buyer_first_name: order.buyer_details.first_name,
            buyer_last_name: order.buyer_details.last_name,
            buyer_phone: order.buyer_details.phone
          })
        })
      }
    })
    
    console.log(`Found ${tickets.length} tickets for event ${eventId}`)
    
    return NextResponse.json(tickets)
  } catch (error) {
    console.error('Error fetching tickets:', error)
    return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 })
  }
}