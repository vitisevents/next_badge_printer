import { createClient } from '@supabase/supabase-js'

// Client-side Supabase client
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Server-side Supabase client with service role key (for admin operations)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Database types
export interface Template {
  id: string
  name: string
  description?: string
  page_size: {
    id: string
    name: string
    width: number
    height: number
    cssWidth: string
    cssHeight: string
  }
  background_color: string
  background_image_url?: string
  bleed: number
  name_color: string
  name_font_size: number
  show_event_name: boolean
  qr_code_settings?: {
    showOnFront: boolean
    showOnBack: boolean
    position: { x: number, y: number }
    size: number
  }
  created_at: string
  updated_at: string
}