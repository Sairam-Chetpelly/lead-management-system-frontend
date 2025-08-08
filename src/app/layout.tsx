import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'LMS App',
  description: 'Learning Management System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet" />
      </head>
      <body className="bg-gray-50">{children}</body>
    </html>
  )
}