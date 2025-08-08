import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json()
    
    if (!imageUrl) {
      return NextResponse.json({ error: 'imageUrl is required' }, { status: 400 })
    }
    
    // Only allow Vercel Blob storage URLs
    if (!imageUrl.includes('blob.vercel-storage.com')) {
      return NextResponse.json({ error: 'Only Vercel Blob storage URLs are allowed' }, { status: 403 })
    }
    
    console.log('Converting image to base64:', imageUrl)
    
    // Add token as query parameter for Vercel Blob authentication
    const urlWithAuth = new URL(imageUrl)
    urlWithAuth.searchParams.set('token', process.env.BLOB_READ_WRITE_TOKEN!)
    
    // Fetch the image with token in URL
    const response = await fetch(urlWithAuth.toString())
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`)
    }
    
    const arrayBuffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'image/png'
    
    // Convert to base64
    const base64 = Buffer.from(arrayBuffer).toString('base64')
    const dataUrl = `data:${contentType};base64,${base64}`
    
    console.log('Image converted successfully:', contentType, base64.length, 'chars')
    
    return NextResponse.json({ 
      dataUrl,
      contentType,
      size: arrayBuffer.byteLength 
    })
    
  } catch (error) {
    console.error('Error converting image:', error)
    return NextResponse.json({ 
      error: 'Failed to convert image',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}