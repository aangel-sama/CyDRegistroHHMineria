// Layout raíz que envuelve a todas las páginas
// Aquí se cargan fuentes, metadatos y estilos globales.
// src/app/layout.tsx
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

// Carga de las fuentes de Google que se usarán globalmente
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "CyD Registro de Horas",
  description: "App de registro de horas",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Proporciona el HTML base para todas las rutas. Aquí se insertan las
  // fuentes y se renderiza el contenido específico de cada página.
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  )
}
