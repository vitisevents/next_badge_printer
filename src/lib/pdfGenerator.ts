import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import type { Template } from '@/types/config'

interface BadgeData {
  element: HTMLElement
  template: Template
}

export async function generateBadgesPDF(
  badges: BadgeData[],
  filename: string = 'badges.pdf'
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

  for (let i = 0; i < badges.length; i++) {
    const { element } = badges[i]
    
    try {
      // Convert badge HTML to canvas with high quality
      const canvas = await html2canvas(element, {
        scale: 3, // High DPI for print quality
        useCORS: true,
        allowTaint: false,
        backgroundColor: null,
        width: element.offsetWidth,
        height: element.offsetHeight,
        logging: false
      })
      
      // Convert canvas to image data
      const imgData = canvas.toDataURL('image/jpeg', 1.0)
      
      // Add new page for each badge (except the first)
      if (i > 0) {
        pdf.addPage([pageWidth, pageHeight])
      }
      
      // Add image to PDF at exact page dimensions
      pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight)
      
    } catch (error) {
      console.error(`Error processing badge ${i + 1}:`, error)
      // Continue with next badge
    }
  }
  
  // Save the PDF
  pdf.save(filename)
}

export async function generateSingleBadgePDF(
  element: HTMLElement,
  template: Template,
  filename: string = 'badge.pdf'
): Promise<void> {
  return generateBadgesPDF([{ element, template }], filename)
}