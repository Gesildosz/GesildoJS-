import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import localFont from "next/font/local" // Importa localFont

// Define a fonte JBS localmente
const jbsFont = localFont({
  src: "../public/fonts/jbs-font.woff2", // Caminho para o seu arquivo de fonte JBS
  variable: "--font-jbs", // Define uma variável CSS para a fonte
  display: "swap", // Garante que a fonte seja exibida rapidamente
})

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.className} ${jbsFont.variable}`}>
      <body>{children}</body>
    </html>
  )
}

export const metadata = {
      generator: 'v0.dev'
    };
