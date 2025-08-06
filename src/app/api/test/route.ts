import { NextResponse } from 'next/server'

const API_BASE = 'https://api.tickettailor.com/v1'

export async function GET() {
  try {
    const apiKey = process.env.TT_APIKEY
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
    }

    console.log('Testing API key:', `${apiKey.substring(0, 8)}...`)
    
    // Try accessing the orders endpoint instead, which might have different permissions
    const authString = `${apiKey}:`
    const authEncoded = Buffer.from(authString).toString('base64')

    const response = await fetch(`${API_BASE}/orders`, {
      headers: {
        'Authorization': `Basic ${authEncoded}`,
        'Accept': 'application/json'
      }
    })

    console.log('Orders endpoint response:', {
      status: response.status,
      statusText: response.statusText
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Orders API Error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      })
      
      // Also try events with a different approach
      const eventsResponse = await fetch(`${API_BASE}/events`, {
        headers: {
          'Authorization': `Basic ${authEncoded}`,
          'Accept': 'application/json'
        }
      })
      
      console.log('Events endpoint response:', {
        status: eventsResponse.status,
        statusText: eventsResponse.statusText
      })
      
      if (!eventsResponse.ok) {
        const eventsErrorText = await eventsResponse.text()
        console.error('Events API Error:', eventsErrorText)
      }
      
      return NextResponse.json({ 
        error: 'API access denied',
        details: {
          ordersStatus: response.status,
          eventsStatus: eventsResponse.status,
          message: 'API key may not have access to this box office data'
        }
      }, { status: 403 })
    }

    const data = await response.json()
    return NextResponse.json({ 
      success: true,
      message: 'API key is working',
      ordersCount: data.data ? data.data.length : 0,
      data: data.data?.slice(0, 2) // Just show first 2 items for testing
    })
  } catch (error) {
    console.error('Error testing API:', error)
    return NextResponse.json({ error: 'Failed to test API' }, { status: 500 })
  }
}