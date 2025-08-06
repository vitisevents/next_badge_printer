// Google Fonts integration
const GOOGLE_FONTS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_FONTS_API_KEY

export interface GoogleFont {
  family: string
  variants: string[]
  subsets: string[]
  category: string
}

// Popular badge-friendly fonts
export const POPULAR_FONTS = [
  'Inter',
  'Roboto',
  'Open Sans',
  'Montserrat',
  'Lato',
  'Poppins',
  'Source Sans Pro',
  'Raleway',
  'Ubuntu',
  'Nunito Sans',
  'Merriweather',
  'Playfair Display',
  'Oswald',
  'PT Sans',
  'Crimson Text'
]

export const FONT_WEIGHTS = [
  { value: '300', label: 'Light' },
  { value: '400', label: 'Regular' },
  { value: '500', label: 'Medium' },
  { value: '600', label: 'Semi Bold' },
  { value: '700', label: 'Bold' },
  { value: '800', label: 'Extra Bold' }
]

export const FONT_SIZES = [
  { value: 12, label: '12px - Small' },
  { value: 14, label: '14px - Regular' },
  { value: 16, label: '16px - Medium' },
  { value: 18, label: '18px - Large' },
  { value: 20, label: '20px - Extra Large' },
  { value: 24, label: '24px - Heading' },
  { value: 28, label: '28px - Large Heading' },
  { value: 32, label: '32px - Display' },
  { value: 40, label: '40px - Large Display' },
  { value: 48, label: '48px - Banner' }
]

// Load a Google Font dynamically
export const loadGoogleFont = (fontFamily: string, weights: string[] = ['400', '700']) => {
  // Check if font is already loaded
  const existingLink = document.querySelector(`link[href*="${fontFamily.replace(' ', '+')}"]`)
  if (existingLink) return

  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(' ', '+')}:wght@${weights.join(';')}&display=swap`
  
  document.head.appendChild(link)
}

// Get CSS font stack for a Google Font
export const getFontStack = (fontFamily: string): string => {
  const fallbacks: Record<string, string> = {
    'Inter': '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    'Roboto': '"Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    'Open Sans': '"Open Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    'Montserrat': '"Montserrat", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    'Lato': '"Lato", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    'Poppins': '"Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    'Source Sans Pro': '"Source Sans Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    'Raleway': '"Raleway", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    'Ubuntu': '"Ubuntu", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    'Nunito Sans': '"Nunito Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    'Merriweather': '"Merriweather", Georgia, "Times New Roman", serif',
    'Playfair Display': '"Playfair Display", Georgia, "Times New Roman", serif',
    'Oswald': '"Oswald", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    'PT Sans': '"PT Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    'Crimson Text': '"Crimson Text", Georgia, "Times New Roman", serif'
  }

  return fallbacks[fontFamily] || `"${fontFamily}", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
}

// Preload popular fonts
export const preloadPopularFonts = () => {
  POPULAR_FONTS.slice(0, 5).forEach(font => {
    loadGoogleFont(font, ['400', '500', '600', '700'])
  })
}