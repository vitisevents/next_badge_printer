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
    const eventId = searchParams.get('event_id') || searchParams.get('eventId')
    const dateFrom = searchParams.get('date_from') // ISO date string (YYYY-MM-DD)
    const dateTo = searchParams.get('date_to') // ISO date string (YYYY-MM-DD)
    const searchQuery = searchParams.get('search')
    
    if (!eventId) {
      return NextResponse.json({ error: 'event_id is required' }, { status: 400 })
    }
    
    // Convert date strings to Unix timestamps if provided
    let dateParams = ''
    if (dateFrom) {
      const fromTimestamp = Math.floor(new Date(dateFrom).getTime() / 1000)
      dateParams += `&created_at_gte=${fromTimestamp}`
    }
    if (dateTo) {
      // Add 23:59:59 to the end date to include the whole day
      const toDate = new Date(dateTo)
      toDate.setHours(23, 59, 59, 999)
      const toTimestamp = Math.floor(toDate.getTime() / 1000)
      dateParams += `&created_at_lte=${toTimestamp}`
    }

    // Create debug log
    const debugLog: any[] = []
    debugLog.push({
      timestamp: new Date().toISOString(),
      message: 'Starting ticket fetch',
      eventId,
      dateFrom,
      dateTo,
      dateParams
    })

    // Use a Set to track unique order IDs and prevent duplicates
    const uniqueOrderIds = new Set<string>()
    let allOrders: any[] = []
    let lastOrderId: string | null = null
    let hasMore = true
    let pageCount = 0
    
    while (hasMore) {
      // TicketTailor uses cursor-based pagination with 'starting_after'
      const url: string = lastOrderId 
        ? `${API_BASE}/orders?limit=100&starting_after=${lastOrderId}${dateParams}`
        : `${API_BASE}/orders?limit=100${dateParams}`
      
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
      
      pageCount++
      
      // Log sample order to understand structure
      if (pageCount === 1 && pageOrders.length > 0) {
        debugLog.push({
          message: 'Sample order structure',
          order: pageOrders[0],
          event_summary: pageOrders[0].event_summary,
          event_id_in_order: pageOrders[0].event_summary?.event_id
        })
      }
      
      // Filter orders for this event
      let newOrdersCount = 0
      const eventOrders = pageOrders.filter((order: any) => {
        if (order.event_summary?.event_id === eventId) {
          if (!uniqueOrderIds.has(order.id)) {
            uniqueOrderIds.add(order.id)
            newOrdersCount++
            return true
          }
        }
        return false
      })
      
      // Update lastOrderId for next page (use the last order ID from the current page)
      if (pageOrders.length > 0) {
        lastOrderId = pageOrders[pageOrders.length - 1].id
      }
      
      debugLog.push({
        page: pageCount,
        totalOrdersInPage: pageOrders.length,
        newOrdersForEvent: newOrdersCount,
        totalUniqueOrders: uniqueOrderIds.size,
        eventIdWeAreLookingFor: eventId,
        lastOrderId,
        nextUrl: ordersData.links?.next
      })
      
      allOrders = allOrders.concat(eventOrders)
      
      // Check if there are more pages
      hasMore = ordersData.links?.next ? true : false
      
      console.log(`Page ${pageCount}: ${pageOrders.length} total orders, ${newOrdersCount} new for event, ${uniqueOrderIds.size} unique so far`)
      
      // Stop if we got no orders on this page
      if (pageOrders.length === 0) {
        console.log('No more orders to fetch')
        break
      }
      
      // Safety check to prevent infinite loops
      if (pageCount > 50) {
        console.warn('Reached maximum pagination limit')
        break
      }
    }
    
    const orders = allOrders
    
    // Extract tickets from orders for the specified event
    const tickets: any[] = []
    
    // Log first order details for debugging
    if (orders.length > 0) {
      debugLog.push({
        message: 'First order with tickets',
        orderId: orders[0].id,
        eventId: orders[0].event_summary?.event_id,
        ticketCount: orders[0].issued_tickets?.length,
        firstTicket: orders[0].issued_tickets?.[0]
      })
    }
    
    orders.forEach((order: any) => {
      // Only process completed orders, not cancelled or pending
      if (order.status === 'completed' && order.issued_tickets) {  // Already filtered by event above
        order.issued_tickets.forEach((ticket: any) => {
          // Only include valid tickets, not voided ones
          if (ticket.status !== 'voided' && !ticket.voided_at) {
          // Start with ticket-level custom questions (individual attendee data)
          const customQuestions: Record<string, string> = {}
          
          // Add ticket-level custom questions FIRST (these are individual attendee details)
          if (ticket.custom_questions) {
            ticket.custom_questions.forEach((q: any) => {
              if (q.question && q.answer) {
                customQuestions[q.question.toLowerCase().replace(/[^a-z0-9]/g, '_')] = q.answer
              }
            })
          }
          
          // Add order-level custom questions ONLY if not already present from ticket level
          if (order.buyer_details.custom_questions) {
            order.buyer_details.custom_questions.forEach((q: any) => {
              if (q.question && q.answer) {
                const key = q.question.toLowerCase().replace(/[^a-z0-9]/g, '_')
                // Only add if not already present from ticket-level questions
                if (!customQuestions[key]) {
                  customQuestions[key] = q.answer
                }
              }
            })
          }

          // Determine holder name - prioritize individual ticket attendee details
          let holderName = order.buyer_details.name || `${order.buyer_details.first_name} ${order.buyer_details.last_name}`.trim()
          let holderEmail = order.buyer_details.email || ticket.email
          
          // Use individual ticket attendee details if available (these are the actual attendees)
          if (ticket.full_name) {
            holderName = ticket.full_name
          } else if (ticket.first_name && ticket.last_name) {
            holderName = `${ticket.first_name} ${ticket.last_name}`.trim()
          } else if (ticket.first_name) {
            holderName = ticket.first_name
          } else if (ticket.last_name) {
            holderName = ticket.last_name
          }
          
          if (ticket.email) {
            holderEmail = ticket.email
          }

          tickets.push({
            id: ticket.id,
            reference: ticket.barcode || ticket.id,
            ticket_type_id: ticket.ticket_type_id,
            holder_name: holderName,
            holder_email: holderEmail,
            order_id: order.id,
            custom_fields: customQuestions,
            ticket_description: ticket.description,
            order_reference: order.reference || order.id,
            buyer_first_name: order.buyer_details.first_name,
            buyer_last_name: order.buyer_details.last_name,
            buyer_phone: order.buyer_details.phone
          })
          }  // Close the status check
        })
      }
    })
    
    console.log(`Found ${tickets.length} tickets for event ${eventId}`)
    
    // Apply search filter if provided
    let filteredTickets = tickets
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filteredTickets = tickets.filter((ticket: any) => 
        ticket.holder_name?.toLowerCase().includes(query) ||
        ticket.holder_email?.toLowerCase().includes(query) ||
        ticket.ticket_description?.toLowerCase().includes(query) ||
        Object.values(ticket.custom_fields || {}).some((value: any) => 
          typeof value === 'string' && value.toLowerCase().includes(query)
        )
      )
      console.log(`Search "${searchQuery}" returned ${filteredTickets.length} results`)
    }
    
    // Write debug log to file (development only)
    debugLog.push({
      message: 'Final summary',
      totalOrders: orders.length,
      totalTickets: tickets.length,
      eventId,
      uniqueTicketTypes: Array.from(new Set(tickets.map((t: any) => t.ticket_type_id))),
      sampleTickets: tickets.slice(0, 3)
    })
    
    if (process.env.NODE_ENV === 'development') {
      try {
        const logPath = join(process.cwd(), 'debug-tickets.log')
        writeFileSync(logPath, JSON.stringify(debugLog, null, 2))
        console.log('Debug log written to:', logPath)
      } catch (err) {
        console.error('Failed to write debug log:', err)
      }
    } else {
      console.log('Debug log (production):', JSON.stringify(debugLog.slice(-1)[0], null, 2))
    }
    
    return NextResponse.json({ tickets: filteredTickets })
  } catch (error) {
    console.error('Error fetching tickets:', error)
    return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 })
  }
}