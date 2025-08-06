import type { Event, TicketType, Order, Ticket } from '@/types/tickettailor'

const API_BASE = 'https://api.tickettailor.com/v1'
const API_KEY = process.env.TT_APIKEY

if (!API_KEY) {
  throw new Error('TT_APIKEY environment variable is not set')
}

const headers = {
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type': 'application/json'
}

export async function fetchEvents(): Promise<Event[]> {
  try {
    const response = await fetch(`${API_BASE}/events`, { headers })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch events: ${response.statusText}`)
    }
    
    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error('Error fetching events:', error)
    throw error
  }
}

export async function fetchTicketTypes(eventId: string): Promise<TicketType[]> {
  try {
    const response = await fetch(`${API_BASE}/ticket_types?event_id=${eventId}`, { headers })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ticket types: ${response.statusText}`)
    }
    
    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error('Error fetching ticket types:', error)
    throw error
  }
}

export async function fetchOrders(eventId: string): Promise<Order[]> {
  try {
    const response = await fetch(`${API_BASE}/orders?event_id=${eventId}`, { headers })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch orders: ${response.statusText}`)
    }
    
    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error('Error fetching orders:', error)
    throw error
  }
}

export async function fetchTickets(eventId: string): Promise<Ticket[]> {
  try {
    const response = await fetch(`${API_BASE}/issued_tickets?event_id=${eventId}`, { headers })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch tickets: ${response.statusText}`)
    }
    
    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error('Error fetching tickets:', error)
    throw error
  }
}