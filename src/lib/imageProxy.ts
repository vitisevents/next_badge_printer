/**
 * Utility function to handle image URLs and proxy them if needed to avoid CORS issues
 */
export function getProxiedImageUrl(imageUrl: string | undefined): string | undefined {
  if (!imageUrl) {
    return undefined
  }
  
  // If it's a Vercel Blob storage URL, proxy it to avoid CORS issues
  if (imageUrl.includes('blob.vercel-storage.com')) {
    return `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`
  }
  
  // For other URLs, return as-is
  return imageUrl
}

/**
 * Convert blob image URL to base64 data URL to completely avoid CORS
 */
export async function convertImageToDataUrl(imageUrl: string): Promise<string | null> {
  try {
    const response = await fetch('/api/convert-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrl }),
    })
    
    if (response.ok) {
      const data = await response.json()
      return data.dataUrl
    } else {
      console.error('Failed to convert image:', response.status, response.statusText)
      return null
    }
  } catch (error) {
    console.error('Error converting image to data URL:', error)
    return null
  }
}

/**
 * Preload an image to ensure it's cached before html2canvas processes it
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    // For Vercel Blob storage, don't set crossOrigin as they're public
    if (!src.includes('blob.vercel-storage.com')) {
      img.crossOrigin = 'anonymous'
    }
    img.onload = () => resolve()
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`))
    img.src = src
  })
}