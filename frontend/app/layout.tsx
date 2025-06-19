import type { Metadata } from 'next'
import './globals.css'
import { Inter } from 'next/font/google'
import { SocketProvider } from './context/SocketContext'
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PetEat',
  description: 'Your trusted veterinary care platform',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SocketProvider>
          {children}
          <Toaster />
        </SocketProvider>
      </body>
    </html>
  )
}
