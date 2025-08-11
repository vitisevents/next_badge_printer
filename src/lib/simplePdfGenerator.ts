import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import type { Template } from '@/types/config'

interface BadgeData {
  element: HTMLElement
  template: Template
}

export async function generateBadgesPDF(
  badges: BadgeData[],
  filename: string = 'badges.pdf',
  onProgress?: (progress: number, current: number, total: number) => void
): Promise<void> {
  if (badges.length === 0) {
    throw new Error('No badges to generate')
  }

  const { template } = badges[0]
  const bleed = template.bleed || 0
  
  // Calculate badge dimensions including bleed (in mm)
  const badgeWidth = template.pageSize.width + (bleed * 2)
  const badgeHeight = template.pageSize.height + (bleed * 2)
  
  // For butterfly badges, the page height is double the badge height
  const pageWidth = badgeWidth
  const pageHeight = badgeHeight * 2
  
  // Create PDF with custom page size for butterfly layout
  const pdf = new jsPDF({
    unit: 'mm',
    format: [pageWidth, pageHeight],
    orientation: 'portrait' // Always portrait for butterfly badges
  })

  console.log(`Starting PDF generation for ${badges.length} badges (${badges.length / 2} physical pages)`)

  // Process badges in pairs (front + back)
  for (let i = 0; i < badges.length; i += 2) {
    const frontBadge = badges[i]
    const backBadge = badges[i + 1] // Should be the back of the same badge
    
    if (!frontBadge) continue
    
    console.log(`Processing badge pair ${Math.floor(i / 2) + 1}/${Math.ceil(badges.length / 2)}`)
    
    // Process front badge
    const frontData = await processBadgeElement(frontBadge.element, i, badges.length, onProgress)
    
    let backData: string | null = null
    if (backBadge) {
      // Process back badge  
      backData = await processBadgeElement(backBadge.element, i + 1, badges.length, onProgress)
    }
    
    // Add new page for each badge pair (except the first)
    if (i > 0) {
      pdf.addPage([pageWidth, pageHeight])
    }
    
    // Add front badge to PDF at the top (normal orientation)
    pdf.addImage(frontData, 'JPEG', 0, 0, badgeWidth, badgeHeight, undefined, 'FAST')
    
    // If we have a back badge, add it rotated 180° at the bottom
    if (backData) {
      // Create a temporary canvas to rotate the back image
      const img = new Image()
      img.src = backData
      
      // Wait for image to load
      await new Promise((resolve) => {
        img.onload = resolve
      })
      
      // Create canvas for rotation
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')!
      
      // Rotate 180 degrees
      ctx.translate(canvas.width, canvas.height)
      ctx.rotate(Math.PI)
      ctx.drawImage(img, 0, 0)
      
      // Get rotated image data
      const rotatedData = canvas.toDataURL('image/jpeg', 0.95)
      
      // Add the rotated back image to the bottom half of the page
      pdf.addImage(rotatedData, 'JPEG', 0, badgeHeight, badgeWidth, badgeHeight, undefined, 'FAST')
    }
    
    console.log(`Badge pair ${Math.floor(i / 2) + 1}: Added front${backData ? ' and back (rotated 180°)' : ''} to PDF`)
  }
  
  // Save the PDF
  try {
    const pairCount = Math.ceil(badges.length / 2)
    console.log(`Saving PDF with ${pairCount} pages (${badges.length} badges total)`)
    pdf.save(filename)
    console.log('PDF saved successfully')
  } catch (error) {
    console.error('Error saving PDF:', error)
    throw new Error(`Failed to save PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Helper function to process a single badge element
async function processBadgeElement(
  element: HTMLElement, 
  index: number, 
  total: number,
  onProgress?: (progress: number, current: number, total: number) => void
): Promise<string> {
  try {
    // Report progress
    if (onProgress) {
      const progress = Math.round(((index + 1) / total) * 100)
      onProgress(progress, index + 1, total)
    }
    
    console.log(`Processing badge ${index + 1}/${total}`)
    
    // Debug: Check the actual text content before rendering
    const nameElements = element.querySelectorAll('h1')
    if (nameElements.length > 0) {
      console.log(`Badge ${index + 1}: Name in DOM = "${nameElements[0].textContent}"`)
    }
    
    // Validate element exists and has dimensions
    if (!element) {
      console.error(`Badge ${index + 1}: Element is null or undefined`)
      throw new Error(`Badge element ${index + 1} not found`)
    }
    
    if (element.offsetWidth === 0 || element.offsetHeight === 0) {
      console.error(`Badge ${index + 1}: Element has zero dimensions`)
      throw new Error(`Badge element ${index + 1} has no size`)
    }
    
    // Small delay to prevent UI blocking
    if (index > 0) {
      await new Promise(resolve => setTimeout(resolve, 50))
    }
    
    // Check if this element is inside a badge-back container
    const backContainer = element.closest('.badge-back')
    let temporaryStyle: HTMLStyleElement | null = null
    
    if (backContainer) {
      // Inject temporary CSS to override the rotateY transform
      temporaryStyle = document.createElement('style')
      temporaryStyle.innerHTML = `
        .badge-back {
          transform: none !important;
        }
      `
      document.head.appendChild(temporaryStyle)
      console.log(`Badge ${index + 1}: Temporarily overrode .badge-back transform`)
    }
    
    // Convert element to canvas with higher quality settings
    const canvas = await html2canvas(element, {
      scale: 4,  // High resolution (300+ DPI)
      useCORS: true,  // Allow cross-origin images
      allowTaint: false,  // Prevent tainted canvas
      backgroundColor: '#ffffff',
      logging: false,
      imageTimeout: 15000,  // Give more time for images to load
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      // Better handling of SVG images
      foreignObjectRendering: false,  // Don't use foreignObject for SVG
      removeContainer: false  // Keep original container structure
    })
    
    // Remove temporary style override
    if (temporaryStyle) {
      document.head.removeChild(temporaryStyle)
      console.log(`Badge ${index + 1}: Removed temporary style override`)
    }
    
    console.log(`Badge ${index + 1}: Canvas created ${canvas.width}x${canvas.height}`)
    
    // Convert to image data (using JPEG for better performance at high resolution)
    let imgData: string
    try {
      imgData = canvas.toDataURL('image/jpeg', 0.95)  // High quality JPEG
    } catch (dataUrlError) {
      console.error(`Badge ${index + 1}: Failed to convert canvas to data URL (likely tainted):`, dataUrlError)
      // Try using blob method as fallback
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob)
          else reject(new Error('Failed to create blob'))
        }, 'image/jpeg', 0.95)
      })
      imgData = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(blob)
      })
      console.log(`Badge ${index + 1}: Used blob fallback method`)
    }
    
    return imgData
    
  } catch (error) {
    console.error(`Error processing badge ${index + 1}:`, error)
    // Try to provide more specific error information
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    throw error // Stop on first error for simplicity
  }
}

export async function generateSingleBadgePDF(
  element: HTMLElement,
  template: Template,
  filename: string = 'badge.pdf'
): Promise<void> {
  return generateBadgesPDF([{ element, template }], filename)
}