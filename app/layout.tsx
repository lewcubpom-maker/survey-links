import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Survey Link System',
  description: 'ระบบจัดการลิงก์ survey',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  )
}
