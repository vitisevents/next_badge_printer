import type { PageSize } from '@/types/config'

export const ISO_PAGE_SIZES: PageSize[] = [
  {
    id: 'a7',
    name: 'A7',
    width: 74,
    height: 105,
    cssWidth: '74mm',
    cssHeight: '105mm'
  },
  {
    id: 'a6',
    name: 'A6', 
    width: 105,
    height: 148,
    cssWidth: '105mm',
    cssHeight: '148mm'
  },
  {
    id: 'a5',
    name: 'A5',
    width: 148,
    height: 210,
    cssWidth: '148mm',
    cssHeight: '210mm'
  },
  {
    id: 'custom_badge',
    name: 'Badge (3.5" x 4.25")',
    width: 89,
    height: 108,
    cssWidth: '89mm',
    cssHeight: '108mm'
  }
]

export const DEFAULT_PAGE_SIZE = ISO_PAGE_SIZES[0] // A7