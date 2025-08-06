export interface PageSize {
  id: string
  name: string
  width: number // mm
  height: number // mm
  cssWidth: string
  cssHeight: string
}

export interface Template {
  id: string
  name: string
  description?: string
  pageSize: PageSize
  backgroundImage?: string // Blob URL (JPG/PNG/PDF)
  backgroundImageType?: 'image' | 'pdf' // Type of background
  backgroundColor?: string
  bleed: number // mm
  createdAt: string
  updatedAt: string
}

export interface CustomField {
  key: string
  label: string
  type: 'text' | 'select' | 'boolean'
  required: boolean
}

export interface FontStyle {
  fontFamily: string
  fontSize: number // px
  fontWeight: string // '400', '500', '600', '700', etc.
  color: string // hex color
  textAlign?: 'left' | 'center' | 'right'
  lineHeight?: number
}

export interface BadgeField {
  id: string
  label: string
  source: 'attendee' | 'event' | 'ticket' | 'custom'
  field: string
  visible: boolean
  fontStyle: FontStyle
  position?: {
    x: number
    y: number
  }
}

export interface EventConfiguration {
  eventId: string
  eventName: string
  ticketTypeColors: Record<string, string>
  customFields: CustomField[]
  badgeFields: BadgeField[]
  updatedAt: string
}

export interface BadgeGenerationConfig {
  templateId: string
  eventId: string
  selectedTicketTypes: string[]
  selectedFields: string[]
  pageSize: PageSize
}