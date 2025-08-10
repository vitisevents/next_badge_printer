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
  
  // Calculate page dimensions including bleed (in mm)
  const pageWidth = template.pageSize.width + (bleed * 2)
  const pageHeight = template.pageSize.height + (bleed * 2)
  
  // Create PDF with custom page size
  const pdf = new jsPDF({
    unit: 'mm',
    format: [pageWidth, pageHeight],
    orientation: pageWidth > pageHeight ? 'landscape' : 'portrait'
  })

  console.log(`Starting PDF generation for ${badges.length} badges`)

  for (let i = 0; i < badges.length; i++) {
    const { element } = badges[i]
    
    try {
      // Report progress
      if (onProgress) {
        const progress = Math.round(((i + 1) / badges.length) * 100)
        onProgress(progress, i + 1, badges.length)
      }
      
      console.log(`Processing badge ${i + 1}/${badges.length}`)
      
      // Debug: Check the actual text content before rendering
      const nameElements = element.querySelectorAll('h1')
      if (nameElements.length > 0) {
        console.log(`Badge ${i + 1}: Name in DOM = "${nameElements[0].textContent}"`)
      }
      
      // Validate element exists and has dimensions
      if (!element) {
        console.error(`Badge ${i + 1}: Element is null or undefined`)
        throw new Error(`Badge element ${i + 1} not found`)
      }
      
      if (element.offsetWidth === 0 || element.offsetHeight === 0) {
        console.error(`Badge ${i + 1}: Element has zero dimensions`)
        throw new Error(`Badge element ${i + 1} has no size`)
      }
      
      // Small delay to prevent UI blocking
      if (i > 0) {
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
        console.log(`Badge ${i + 1}: Temporarily overrode .badge-back transform`)
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
        console.log(`Badge ${i + 1}: Removed temporary style override`)
      }
      
      console.log(`Badge ${i + 1}: Canvas created ${canvas.width}x${canvas.height}`)
      
      // Convert to image data (using JPEG for better performance at high resolution)
      let imgData: string
      try {
        imgData = canvas.toDataURL('image/jpeg', 0.95)  // High quality JPEG
      } catch (dataUrlError) {
        console.error(`Badge ${i + 1}: Failed to convert canvas to data URL (likely tainted):`, dataUrlError)
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
        console.log(`Badge ${i + 1}: Used blob fallback method`)
      }
      
      // Add new page for each badge (except the first)
      if (i > 0) {
        pdf.addPage([pageWidth, pageHeight])
      }
      
      // Add image to PDF with compression settings for quality
      pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight, undefined, 'FAST')
      
      console.log(`Badge ${i + 1}: Added to PDF`)
      
    } catch (error) {
      console.error(`Error processing badge ${i + 1}:`, error)
      // Try to provide more specific error information
      if (error instanceof Error) {
        console.error('Error message:', error.message)
        console.error('Error stack:', error.stack)
      }
      throw error // Stop on first error for simplicity
    }
  }
  
  // Save the PDF
  console.log(`Saving PDF: ${filename}`)
  pdf.save(filename)
  console.log('PDF saved successfully')
}

export async function generateSingleBadgePDF(
  element: HTMLElement,
  template: Template,
  filename: string = 'badge.pdf'
): Promise<void> {
  return generateBadgesPDF([{ element, template }], filename)
}