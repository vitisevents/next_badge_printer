export interface PageSize {
  id: string
  name: string
  width: number // mm
  height: number // mm
  cssWidth: string
  cssHeight: string
}

export interface QRCodeSettings {
  showOnFront: boolean
  showOnBack: boolean
  position: {
    x: number // percentage (0-100)
    y: number // percentage (0-100)
  }
  size: number // mm
}

export interface Template {
  id: string
  name: string
  description?: string
  pageSize: PageSize
  backgroundImage?: string // Blob URL (JPG/PNG/WebP/SVG)
  backgroundColor?: string
  bleed: number // mm
  showEventName?: boolean // Show event name on badge (default: true)
  nameColor?: string // Font color for the main name (default: #111827)
  nameFontSize?: number // Font size for the main name in px (default: 24)
  qrCode?: QRCodeSettings
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
  ticketTypeNames: Record<string, string> // Override display names for ticket types
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