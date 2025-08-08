# Badge Printer - Professional Badge Generation System

A Next.js 15 application for generating professional double-sided badges with TicketTailor integration, custom templates, and high-quality PDF output.

## 🚀 Features

- **TicketTailor Integration**: Fetch events, tickets, and attendee data
- **Custom Badge Templates**: Configurable page sizes, colors, fonts, and layouts
- **Double-Sided Badges**: Flip animation preview with front/back content
- **VCard QR Codes**: Automatic contact information QR codes with positioning controls
- **Professional PDF Output**: High-resolution PDFs ready for commercial printing
- **Template Management**: Visual template designer with live preview
- **Sorting & Filtering**: Multiple sorting options including by ticket type
- **Authentication**: Simple frontend authentication system

## 📋 Prerequisites

### Environment Variables

Create a `.env.local` file with the following required variables:

```bash
# TicketTailor API Configuration
TICKETTAILOR_API_KEY=your_tickettailor_api_key_here

# Vercel Blob Storage (for template storage)
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token_here

# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000  # For local development
NEXTAUTH_SECRET=your_random_secret_here  # Generate with: openssl rand -base64 32
```

### TicketTailor API Setup

1. **Get API Key**: 
   - Log in to your TicketTailor account
   - Go to Settings → API
   - Generate a new API key

2. **API Permissions**: Ensure your API key has access to:
   - Events (read)
   - Orders (read)
   - Ticket Types (read)

### Vercel Blob Storage Setup

1. **Create Vercel Project**: Deploy to Vercel or link local project
2. **Enable Blob Storage**: In Vercel dashboard → Storage → Create Blob Store
3. **Get Token**: Copy the `BLOB_READ_WRITE_TOKEN` from storage settings

## 🛠️ Installation & Setup

```bash
# Clone the repository
git clone <repository-url>
cd next_badge_printer

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Run development server
npm run dev

# Open browser
open http://localhost:3000
```

## 📱 Authentication

Default login credentials:
- **Username**: `copia`
- **Password**: `featherstone`

*Note: This is a simple frontend authentication. For production, implement proper authentication.*

## 🔧 PDF Generation Process

### Overview
The PDF generation system creates professional, print-ready badges through a multi-step process:

```
1. Template Selection → 2. Data Fetching → 3. Badge Rendering → 4. PDF Creation
```

### Detailed Process

#### 1. **Template & Data Preparation**
```javascript
// Template contains:
- Page size (A7, A6, A5, T180, etc.)
- Background images/colors
- Font settings (color, size)
- QR code positioning
- Bleed settings for printing

// Data fetching:
- Attendee information from TicketTailor
- Event details and ticket types
- Custom field configurations
```

#### 2. **Badge Rendering Pipeline**
```javascript
// For each badge:
1. Create HTML badge element with styling
2. Apply template settings (fonts, colors, layout)
3. Generate VCard QR code if email available
4. Position QR code based on template settings
5. Apply 10mm text margins for print safety
6. Handle long names with text wrapping
```

#### 3. **HTML to Canvas Conversion**
```javascript
// Using html2canvas library:
1. Wait for DOM rendering (100ms delay)
2. Preload background images via proxy
3. Convert HTML to canvas at 4x scale (high DPI)
4. Handle CORS issues with image proxy
5. Smart format selection (PNG/JPEG based on size)
```

#### 4. **PDF Assembly**
```javascript
// Using jsPDF library:
1. Create PDF with exact page dimensions + bleed
2. Add each badge as a separate page
3. Interleave front/back for double-sided printing
4. Progress tracking throughout process
5. Memory optimization for large batches
```

### Double-Sided Badge Layout

```
Front Page Sequence: 1, 3, 5, 7, 9...
Back Page Sequence:  2, 4, 6, 8, 10...

For duplex printing:
- Print odd pages first
- Flip paper stack
- Print even pages
```

### Quality Optimizations

- **4x Scale Rendering**: Ensures crisp text at print resolution
- **Smart Image Formats**: PNG for quality, JPEG for large files
- **Background Image Proxy**: Bypasses CORS issues
- **Text Safety Margins**: 10mm margins prevent edge clipping
- **Font Loading**: Google Fonts with proper fallbacks

## 🖼️ Template System

### Template Structure
```typescript
interface Template {
  id: string
  name: string
  pageSize: PageSize          // A7, A6, A5, T180 Badge
  backgroundImage?: string    // Vercel Blob URL
  backgroundColor: string     // Hex color
  nameColor: string          // Main name text color
  nameFontSize: number       // Font size in pixels
  bleed: number             // Print bleed in mm
  showEventName: boolean    // Header toggle
  qrCode?: {
    showOnFront: boolean
    showOnBack: boolean
    position: { x: number, y: number }  // Percentage positioning
    size: number                        // Size in mm
  }
}
```

### Page Sizes Available
- **A7**: 74mm × 105mm (Standard badge size)
- **A6**: 105mm × 148mm 
- **A5**: 148mm × 210mm
- **Badge**: 89mm × 108mm (3.5" × 4.25")
- **T180 Badge**: 96mm × 134mm

## 🔄 API Integration

### TicketTailor Endpoints Used

```
GET /events                    # List events
GET /orders?event_id=X         # Get attendee data
GET /ticket_types?event_id=X   # Get ticket types
```

### Pagination Handling
- **Cursor-based pagination** with `starting_after`
- **Automatic duplicate detection**
- **Progress tracking** during data fetching

### Data Processing
```javascript
// Field extraction:
- holder_name, holder_email
- ticket_type_name, ticket_type_id  
- Custom fields from order data
- Company/job title detection

// Sorting options:
- Purchase date (API order)
- First name A-Z
- Last name A-Z  
- First name by ticket type
- Last name by ticket type
```

## 🎨 Customization

### Ticket Type Overrides
In Event Configuration, you can override ticket type names:
- "Early Bird Delegate" → "Delegate"
- "VIP Premium" → "VIP"
- Sorting groups by override names

### VCard QR Code Fields
QR codes automatically include:
- **Name** (required)
- **Email** (required) - searches attendee data then order data
- **Job Title** (optional) - auto-detected from fields
- **Company** (optional) - auto-detected from fields

### Font & Layout Controls
- **Custom name color**: Hex color picker
- **Font size**: 12-48px range
- **Text wrapping**: Automatic with 10mm safe margins
- **QR positioning**: Drag and resize controls

## 🚨 Troubleshooting

### Common Issues

#### "No templates found"
- **Cause**: Vercel Blob storage not configured
- **Solution**: Set up `BLOB_READ_WRITE_TOKEN` or use default template

#### CORS errors for background images
- **Cause**: Browser blocking cross-origin images
- **Solution**: Uses automatic image proxy (`/api/proxy-image`)

#### PDF generation fails at 100%
- **Cause**: Memory issues with large images
- **Solution**: Automatic PNG→JPEG fallback for large files

#### QR codes not appearing
- **Cause**: Missing email data
- **Solution**: Check console logs, ensure attendee has email or order has purchaser email

### Debug Mode

Enable detailed logging by uncommenting debug lines in:
- `/src/components/EnhancedBadgeComponent.tsx`
- `/src/components/QRCodeBadge.tsx`

## 📦 Production Deployment

### Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

### Performance Considerations
- **Memory usage**: Large badge batches (~500+) may need server scaling
- **Image optimization**: Background images should be < 2MB
- **Blob storage**: Monitor storage usage for templates
- **API rate limits**: TicketTailor has rate limiting

## 🔧 Technical Architecture

### Key Libraries
- **Next.js 15**: App Router with TypeScript
- **html2canvas**: HTML to image conversion
- **jsPDF**: PDF generation
- **qrcode**: VCard QR code generation
- **Vercel Blob**: Template and image storage

### File Structure
```
src/
├── app/api/           # API routes
├── components/        # React components
├── lib/              # Utilities
├── types/            # TypeScript types
└── styles/           # CSS files
```

### Data Flow
```
TicketTailor API → Badge Components → html2canvas → jsPDF → Download
                ↗                                            ↘
        Template Storage                                Progress Tracking
```

## 📄 License

This project is proprietary. All rights reserved.

## 🤝 Support

For technical support or feature requests, please contact the development team.

---

**Version**: 1.0.0  
**Last Updated**: January 2025