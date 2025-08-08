'use client'

import { useEffect, useState } from 'react'
import { generateVCardQRCode } from '@/lib/vcardGenerator'
import type { QRCodeSettings } from '@/types/config'

interface QRCodeBadgeProps {
  name: string
  email?: string
  jobTitle?: string
  company?: string
  settings: QRCodeSettings
  containerWidth: number // mm
  containerHeight: number // mm
}

export default function QRCodeBadge({
  name,
  email,
  jobTitle,
  company,
  settings,
  containerWidth,
  containerHeight
}: QRCodeBadgeProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  
  useEffect(() => {
    // Generate QR code if we have name and email
    if (name && email) {
      // Debug: console.log('QRCodeBadge - Generating QR with:', { name, email, jobTitle, company })
      generateVCardQRCode({
        name,
        email,
        jobTitle,
        company
      }).then(setQrCodeUrl).catch(console.error)
    } else {
      // Debug: console.log('QRCodeBadge - Skipping QR generation, missing required data:', { name, email })
    }
  }, [name, email, jobTitle, company])
  
  if (!qrCodeUrl || !name || !email) return null
  
  // Calculate position in mm based on percentage
  const xPosition = (settings.position.x / 100) * containerWidth
  const yPosition = (settings.position.y / 100) * containerHeight
  
  const style = {
    position: 'absolute' as const,
    left: `${xPosition}mm`,
    top: `${yPosition}mm`,
    width: `${settings.size}mm`,
    height: `${settings.size}mm`,
    transform: 'translate(-50%, -50%)', // Center the QR code on the position point
    backgroundColor: 'white',
    padding: '0.5mm',
    borderRadius: '0mm',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    // Additional properties for html2canvas compatibility
    isolation: 'isolate' as const, // Create a new stacking context
    willChange: 'auto', // Disable hardware acceleration
    backfaceVisibility: 'visible' as const,
    zIndex: 10 // Ensure QR code renders on top
  }
  
  return (
    <div style={style}>
      <img 
        src={qrCodeUrl} 
        alt="VCard QR Code" 
        style={{ 
          width: '100%', 
          height: '100%', 
          display: 'block',
          objectFit: 'contain',
          imageRendering: 'crisp-edges' // Ensure sharp rendering for QR codes
        }}
        crossOrigin="anonymous"
      />
    </div>
  )
}