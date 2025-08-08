import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import type { Template } from '@/types/config'
import { preloadImage } from '@/lib/imageProxy'
import clientLogger from './clientLogger'

interface BadgeData {
  element: HTMLElement
  template: Template
}

// Cache for background images to avoid repeated conversions
const backgroundImageCache = new Map<string, string>()

// Helper function to validate badge element before rendering
function validateBadgeElement(element: HTMLElement, index: number): boolean {
  clientLogger.log('PDF_VALIDATION', { badgeIndex: index, message: 'Validating element...' })
  
  // Check dimensions
  if (element.offsetWidth === 0 || element.offsetHeight === 0) {
    clientLogger.error('PDF_VALIDATION', { badgeIndex: index, error: `Element has zero dimensions (${element.offsetWidth}x${element.offsetHeight})` })
    return false
  }
  
  // Check if element is visible
  const computedStyle = window.getComputedStyle(element)
  if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden') {
    clientLogger.error('PDF_VALIDATION', { badgeIndex: index, error: 'Element is hidden' })
    return false
  }
  
  // Check for text content
  const hasText = element.textContent && element.textContent.trim().length > 0
  clientLogger.log('PDF_VALIDATION', { badgeIndex: index, hasText, textContent: element.textContent?.trim() })
  
  // Check for child elements
  const hasChildren = element.children && element.children.length > 0
  clientLogger.log('PDF_VALIDATION', { badgeIndex: index, hasChildren, childCount: element.children?.length })
  
  if (!hasText && !hasChildren) {
    clientLogger.error('PDF_VALIDATION', { badgeIndex: index, error: 'Element appears to be empty (no text or children)' })
    return false
  }
  
  clientLogger.log('PDF_VALIDATION', { badgeIndex: index, message: 'Element validation passed' })
  return true
}

export async function generateBadgesPDF(
  badges: BadgeData[],
  filename: string = 'badges.pdf',
  onProgress?: (progress: number, current: number, total: number) => void
): Promise<void> {
  clientLogger.log('PDF_GENERATION', { message: 'PDF generation started', badgeCount: badges.length, filename })
  
  if (badges.length === 0) {
    clientLogger.error('PDF_GENERATION', { error: 'No badges to generate' })
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

  clientLogger.log('PDF_GENERATION', { totalBadges: badges.length, pageSize: `${pageWidth}mm x ${pageHeight}mm` })

  // Process badges in batches to avoid blocking the browser
  const BATCH_SIZE = 3
  
  for (let i = 0; i < badges.length; i++) {
    const { element } = badges[i]
    
    try {
      // Report progress before processing each badge
      if (onProgress) {
        const progress = Math.round(((i + 1) / badges.length) * 100)
        onProgress(progress, i + 1, badges.length)
      }
      
      // Yield to browser every batch to prevent UI blocking
      if (i > 0 && i % BATCH_SIZE === 0) {
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      
      // Wait for any async operations to complete
      await new Promise(resolve => setTimeout(resolve, 200))
      
      // Ensure fonts are loaded before rendering
      try {
        if ('fonts' in document) {
          await document.fonts.ready
          clientLogger.log('PDF_RENDERING', { badgeIndex: i, message: 'Fonts are ready' })
        }
      } catch (fontError) {
        clientLogger.error('PDF_RENDERING', { badgeIndex: i, error: 'Font loading check failed, continuing', details: fontError })
      }
      
              // Validate badge element before rendering
        if (!validateBadgeElement(element, i)) {
          clientLogger.log('PDF_RENDERING', { badgeIndex: i, message: 'Element validation failed, skipping' })
          continue
        }
      
      // Convert badge HTML to canvas with reliable settings
      let canvas: HTMLCanvasElement
      
      try {
        canvas = await html2canvas(element, {
          scale: 2, // Good quality while maintaining performance
          useCORS: true, // Allow cross-origin images
          allowTaint: true, // Allow tainted canvas
          backgroundColor: '#ffffff',
          width: element.offsetWidth,
          height: element.offsetHeight,
          logging: false, // Reduce console noise
          imageTimeout: 10000, // Longer timeout for reliability
          removeContainer: false, // Keep container to avoid DOM issues
          foreignObjectRendering: true, // Enable for SVG/QR code support
          windowWidth: element.offsetWidth,
          windowHeight: element.offsetHeight,
          scrollX: 0,
          scrollY: 0,
          ignoreElements: (element) => {
            // Ignore print-specific elements
            return element.classList?.contains('print:hidden') || false
          },
          onclone: (clonedDoc, element) => {
            // Add essential inline styles to ensure proper rendering
            const style = clonedDoc.createElement('style')
            style.textContent = `
              * {
                font-display: block !important;
                box-sizing: border-box;
              }
              
              /* Badge container styles */
              .badge {
                position: relative !important;
                overflow: hidden !important;
                isolation: isolate !important;
              }
              
              /* Ensure all text is visible */
              .text-center { text-align: center !important; }
              .text-white { color: white !important; }
              .text-gray-600 { color: #6b7280 !important; }
              .text-gray-900 { color: #111827 !important; }
              .font-medium { font-weight: 500 !important; }
              .font-semibold { font-weight: 600 !important; }
              .font-bold { font-weight: 700 !important; }
              
              /* Layout */
              .flex { display: flex !important; }
              .flex-1 { flex: 1 !important; }
              .flex-col { flex-direction: column !important; }
              .items-center { align-items: center !important; }
              .justify-center { justify-content: center !important; }
              .w-full { width: 100% !important; }
              .h-full { height: 100% !important; }
              
              /* Spacing */
              .py-2 { padding-top: 0.5rem !important; padding-bottom: 0.5rem !important; }
              .mb-4 { margin-bottom: 1rem !important; }
              .space-y-2 > * + * { margin-top: 0.5rem !important; }
              
              /* Text sizing */
              .text-xs { font-size: 0.75rem !important; line-height: 1rem !important; }
              .text-sm { font-size: 0.875rem !important; line-height: 1.25rem !important; }
              .text-base { font-size: 1rem !important; line-height: 1.5rem !important; }
              .text-lg { font-size: 1.125rem !important; line-height: 1.75rem !important; }
              .text-xl { font-size: 1.25rem !important; line-height: 1.75rem !important; }
              .text-2xl { font-size: 1.5rem !important; line-height: 2rem !important; }
              .text-3xl { font-size: 1.875rem !important; line-height: 2.25rem !important; }
              .text-4xl { font-size: 2.25rem !important; line-height: 2.5rem !important; }
              .text-5xl { font-size: 3rem !important; line-height: 1 !important; }
              .text-6xl { font-size: 3.75rem !important; line-height: 1 !important; }
              
              /* Line height */
              .leading-tight { line-height: 1.25 !important; }
              .leading-normal { line-height: 1.5 !important; }
              
              /* Force hardware acceleration off to avoid rendering issues */
              * {
                transform: translateZ(0) !important;
                -webkit-font-smoothing: antialiased !important;
                -moz-osx-font-smoothing: grayscale !important;
              }
            `
            clonedDoc.head.appendChild(style)
            
            // Update Google Font display property for better rendering
            const stylesheetLinks = clonedDoc.querySelectorAll('link[rel="stylesheet"]')
            stylesheetLinks.forEach(link => {
              const href = link.getAttribute('href')
              if (href && href.includes('googleapis.com') && href.includes('display=swap')) {
                // Change display=swap to display=block for reliable rendering
                link.setAttribute('href', href.replace('display=swap', 'display=block'))
                clientLogger.log('PDF_RENDERING', { badgeIndex: i, message: 'Updated Google Font link to display=block' })
              }
            })
          }
        })
        clientLogger.log('PDF_RENDERING', { badgeIndex: i, message: 'Successfully rendered with reliable settings' })
              } catch (error) {
          clientLogger.log('PDF_RENDERING', { badgeIndex: i, error: 'Primary rendering failed, trying fallback', details: error })
        
        // Fallback: More permissive settings
        canvas = await html2canvas(element, {
          scale: 1, // Lower scale for compatibility
          useCORS: true,
          allowTaint: false,
          backgroundColor: '#ffffff',
          width: element.offsetWidth,
          height: element.offsetHeight,
          logging: false,
          imageTimeout: 5000,
          removeContainer: false,
          foreignObjectRendering: false, // Disable for compatibility
          onclone: (clonedDoc) => {
            // Remove all external resources for compatibility
            const links = clonedDoc.querySelectorAll('link[rel="stylesheet"][href*="googleapis.com"]')
            links.forEach(link => link.remove())
            clientLogger.log('PDF_RENDERING', { badgeIndex: i, message: `Removed ${links.length} external font links` })
          }
        })
        clientLogger.log('PDF_RENDERING', { badgeIndex: i, message: 'Fallback rendering succeeded' })
      }
      
      // Debug canvas and element content
      clientLogger.log('PDF_RENDERING', { badgeIndex: i, message: `Canvas ${canvas.width}x${canvas.height}` })
      
              if (canvas.width === 0 || canvas.height === 0) {
          clientLogger.log('PDF_RENDERING', { badgeIndex: i, message: 'Canvas has zero dimensions, skipping' })
          continue
        }
      
      // Convert canvas to image data
      let imgData: string
      try {
        // First try toDataURL (works if canvas is not tainted)
        imgData = canvas.toDataURL('image/jpeg', 0.9)
        clientLogger.log('PDF_RENDERING', { badgeIndex: i, message: 'Successfully used toDataURL' })
      } catch (dataUrlError) {
        clientLogger.log('PDF_RENDERING', { badgeIndex: i, message: 'toDataURL failed (likely tainted), using blob method', details: dataUrlError })
        // Use blob method for tainted canvas
        try {
          const blob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob((blob) => {
              if (blob) resolve(blob)
              else reject(new Error('Failed to create blob'))
            }, 'image/jpeg', 0.9)
          })
          
          // Convert blob to data URL
          imgData = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(blob)
          })
          clientLogger.log('PDF_RENDERING', { badgeIndex: i, message: 'Successfully used blob method' })
        } catch (blobError) {
          clientLogger.error('PDF_RENDERING', { badgeIndex: i, error: 'All export methods failed', details: blobError })
          continue // Skip this badge and continue with others
        }
      }
      
      // Add new page for each badge (except the first)
      if (i > 0) {
        pdf.addPage([pageWidth, pageHeight])
      }
      
      // Add image to PDF at exact page dimensions
      const format = imgData.startsWith('data:image/png') ? 'PNG' : 'JPEG'
      pdf.addImage(imgData, format, 0, 0, pageWidth, pageHeight)
      
    } catch (error) {
      clientLogger.error('PDF_PROCESSING', { badgeIndex: i, error: `Error processing badge ${i + 1}`, details: error })
      // Continue with next badge instead of failing completely
      continue
    }
  }
  
  // Save the PDF
  try {
    clientLogger.log('PDF_SAVING', { totalPages: badges.length, filename })
    pdf.save(filename)
    clientLogger.log('PDF_SAVING', { message: 'PDF saved successfully' })
  } catch (error) {
    clientLogger.error('PDF_SAVING', { error: `Error saving PDF: ${error instanceof Error ? error.message : 'Unknown error'}`, details: error })
    throw new Error(`Failed to save PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function generateSingleBadgePDF(
  element: HTMLElement,
  template: Template,
  filename: string = 'badge.pdf'
): Promise<void> {
  return generateBadgesPDF([{ element, template }], filename)
}