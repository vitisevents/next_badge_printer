import { NextRequest, NextResponse } from 'next/server'

// Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  })
}

export async function GET(request: NextRequest) {
  try {
    console.log('Image proxy request:', request.url)
    const url = request.nextUrl.searchParams.get('url')
    
    if (!url) {
      console.error('No URL parameter provided')
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 })
    }
    
    console.log('Fetching image:', url)
    
    // Only allow Vercel Blob storage URLs for security
    if (!url.includes('blob.vercel-storage.com')) {
      console.error('Invalid URL domain:', url)
      return NextResponse.json({ error: 'Only Vercel Blob storage URLs are allowed' }, { status: 403 })
    }
    
    // Fetch the image from Vercel Blob storage without special headers (they're public)
    const response = await fetch(url)
    
    console.log('Blob response status:', response.status, response.statusText)
    
    if (!response.ok) {
      console.error('Failed to fetch from blob:', response.status, response.statusText)
      // Don't redirect, just return an error
      return NextResponse.json({ error: 'Failed to fetch image' }, { status: response.status })
    }
    
    const imageBuffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'image/png'
    
    console.log('Serving image:', contentType, imageBuffer.byteLength, 'bytes')
    
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600', // 1 hour cache
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Cross-Origin-Resource-Policy': 'cross-origin',
        'Cross-Origin-Embedder-Policy': 'unsafe-none',
      },
    })
  } catch (error) {
    console.error('Error proxying image:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}