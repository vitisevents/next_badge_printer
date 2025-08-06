// Only import PDF.js on client side
let pdfjsLib: any = null

// Initialize PDF.js only on client side
const initPdfJs = async () => {
  if (typeof window !== 'undefined' && !pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist')
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
  }
  return pdfjsLib
}

export interface PDFToImageOptions {
  scale?: number
  page?: number
}

// Convert PDF to image data URL for use as background
export const convertPDFToImage = async (
  pdfUrl: string, 
  options: PDFToImageOptions = {}
): Promise<string> => {
  const { scale = 2, page = 1 } = options

  if (typeof window === 'undefined') {
    throw new Error('PDF conversion is only available on the client side')
  }

  try {
    // Initialize PDF.js
    const pdfLib = await initPdfJs()
    if (!pdfLib) {
      throw new Error('Failed to initialize PDF.js')
    }

    // Load PDF
    const pdf = await pdfLib.getDocument(pdfUrl).promise
    
    // Get first page (or specified page)
    const pdfPage = await pdf.getPage(page)
    
    // Get viewport
    const viewport = pdfPage.getViewport({ scale })
    
    // Create canvas
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    
    if (!context) {
      throw new Error('Could not get canvas context')
    }
    
    canvas.height = viewport.height
    canvas.width = viewport.width
    
    // Render page
    await pdfPage.render({
      canvasContext: context,
      viewport: viewport,
      canvas: canvas
    }).promise
    
    // Convert to data URL
    return canvas.toDataURL('image/png', 1.0)
  } catch (error) {
    console.error('Error converting PDF to image:', error)
    throw error
  }
}

// Validate if file is a PDF
export const isPDFFile = (file: File): boolean => {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
}

// Get PDF info
export const getPDFInfo = async (pdfUrl: string) => {
  if (typeof window === 'undefined') {
    throw new Error('PDF info is only available on the client side')
  }

  try {
    const pdfLib = await initPdfJs()
    if (!pdfLib) {
      throw new Error('Failed to initialize PDF.js')
    }

    const pdf = await pdfLib.getDocument(pdfUrl).promise
    return {
      numPages: pdf.numPages,
      info: await pdf.getMetadata()
    }
  } catch (error) {
    console.error('Error getting PDF info:', error)
    throw error
  }
}