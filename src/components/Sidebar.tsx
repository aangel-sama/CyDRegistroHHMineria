// Barra lateral de navegación mostrada en la mayoría de páginas.
// Contiene enlaces a las distintas secciones y permite cerrar sesión.
// src/components/Sidebar.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Image from 'next/image'

// Rutas donde NO queremos mostrar el sidebar
const publicPaths = ['/login', '/register', '/register/success', '/forgot-password', '/login/reset-password']

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  // Correo de la sesión actual (si existe)
  const [email, setEmail] = useState<string | null>(null)
  // Evita mostrar el sidebar mientras se verifica la sesión
  const [loading, setLoading] = useState(true)

  

  useEffect(() => {
    // Si estamos en una ruta pública, no cargamos nada
    if (publicPaths.some(p => pathname.startsWith(p))) {
      setLoading(false)
      return
    }
    // Si no, intentamos obtener la sesión
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        // Si no hay sesión, redirigimos al login
        router.replace('/login')
      } else {
        setEmail(session.user.email ?? null)
      }
    }).finally(() => setLoading(false))
  }, [pathname, router])

  if (loading) return null
  // Si es ruta pública, no renderizamos nada
  if (publicPaths.some(p => pathname.startsWith(p))) return null

  const items = [
    { href: '/registro-horas', icon: '/Resultados-b.svg', label: 'Registro de horas' },
    { href: '/registro-dias-libres',   icon: '/Schedule-b.svg',   label: 'Registro de días libres' },
  ]

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  return (
    <aside className="fixed top-0 left-0 h-screen w-64 bg-[#802528] text-white flex flex-col justify-between p-4 z-50">
      <div>
        <div className="flex justify-center mb-8">
          <Image src="/Logo_CyD_blanco.svg" alt="CyD Ingeniería" width={56} height={56} className="h-14 w-auto" />
        </div>

        {email && (
          <Link
            href="/profile"
            className="mb-6 px-3 text-sm text-white/80 block hover:underline cursor-pointer"
          >
            {email}
          </Link>
        )}

        <nav className="space-y-2">
          {items.map(({ href, icon, label }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 p-2 rounded ${
                  active ? 'bg-white/20' : 'hover:bg-white/10'
                }`}
              >
                <Image src={icon} alt={label} width={20} height={20} className="w-5 h-5" />
                <span className="text-sm">{label}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      <div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 p-2 rounded hover:bg-white/10 w-full"
        >
          <Image src="/exit-b.svg" alt="Cerrar sesión" width={20} height={20} className="w-5 h-5" />
          <span className="text-sm">Cerrar sesión</span>
        </button>
      </div>
    </aside>
  )
}
