import { NextRequest, NextResponse } from 'next/server'
import logger from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { category, data, type = 'log' } = body

    if (type === 'error') {
      logger.error(category, data)
    } else {
      logger.log(category, data)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('API', error)
    return NextResponse.json({ error: 'Failed to log debug data' }, { status: 500 })
  }
} 