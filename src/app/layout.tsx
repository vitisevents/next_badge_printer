import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Badge Printer',
  description: 'Print badges for TicketTailor events',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Roboto:wght@300;400;500;700&family=Open+Sans:wght@300;400;500;600;700;800&family=Montserrat:wght@300;400;500;600;700;800&family=Lato:wght@300;400;700&display=swap"
          rel="stylesheet"
        />
        {children}
      </body>
    </html>
  )
}