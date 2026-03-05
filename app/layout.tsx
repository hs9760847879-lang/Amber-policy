import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Amber Policy Dashboard',
  description: 'Manage and optimize your active property coverage',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-display bg-background-light dark:bg-background-dark text-gray-900 dark:text-gray-100 min-h-screen">
        {children}
      </body>
    </html>
  )
}
