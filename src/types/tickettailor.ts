export interface Event {
  id: string
  name: string
  description?: string
  start_date: string
  end_date: string
  venue: {
    name: string
    postal_address: string
  }
}

export interface TicketType {
  id: string
  name: string
  colour: string
  price: number
  description?: string
}

export interface Order {
  id: string
  reference: string
  created_date: string
  name: string
  email: string
}

export interface Ticket {
  id: string
  reference: string
  ticket_type_id: string
  holder_name: string
  holder_email: string
  order_id: string
}

export interface Badge {
  attendeeName: string
  ticketType: TicketType
  eventName: string
}