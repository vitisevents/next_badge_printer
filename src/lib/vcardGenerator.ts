import QRCode from 'qrcode'

interface VCardData {
  name: string
  email: string
  jobTitle?: string
  company?: string
}

export function generateVCard(data: VCardData): string {
  // Parse the full name into components
  const nameParts = data.name.trim().split(' ')
  const firstName = nameParts[0] || ''
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : ''
  const middleNames = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : ''
  
  const vcard = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${data.name}`, // Full name as provided
    `N:${lastName};${firstName};${middleNames};;`, // Last;First;Middle;Prefix;Suffix
  ]
  
  if (data.company) {
    vcard.push(`ORG:${data.company}`)
  }
  
  if (data.jobTitle) {
    vcard.push(`TITLE:${data.jobTitle}`)
  }
  
  vcard.push(`EMAIL:${data.email}`)
  vcard.push('END:VCARD')
  
  return vcard.join('\n')
}

export async function generateVCardQRCode(data: VCardData): Promise<string> {
  const vcardString = generateVCard(data)
  
  try {
    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(vcardString, {
      errorCorrectionLevel: 'M',
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 200
    })
    
    return qrCodeDataUrl
  } catch (error) {
    console.error('Error generating QR code:', error)
    throw error
  }
}