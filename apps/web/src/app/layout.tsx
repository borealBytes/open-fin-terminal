import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Open Financial Terminal',
  description: 'Open-source Bloomberg Terminal alternative',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
