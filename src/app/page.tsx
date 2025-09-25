// Página inicial: redirige al login o a registro de horas
'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabaseClient'

export default function Home() {
  const router = useRouter()
  // Al montarse, consultamos la sesión de Supabase para decidir la ruta inicial
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/login')
      } else {
        router.replace('/registro-horas')
      }
    })
  }, [router])

  return null
}
