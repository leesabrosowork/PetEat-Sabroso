import type { Metadata } from 'next'
import './globals.css'
import { Inter } from 'next/font/google'
import { SocketProvider } from './context/SocketContext'
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
// import SplashLayout from "@/components/SplashLayout"; // Remove this

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
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SocketProvider>
            {/* Remove SplashLayout here */}
            {children}
            <Toaster />
          </SocketProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
