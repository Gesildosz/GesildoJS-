import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google" // Ou a fonte que você estiver usando
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] }) // Exemplo de configuração de fonte, se houver

export const metadata: Metadata = {
  title: "JBS RH App",
  description: "Sistema de Gerenciamento de RH para Colaboradores JBS",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
