// Página para solicitar el restablecimiento de contraseña.
// Muestra un formulario donde el usuario ingresa su correo y se
// envía un enlace de recuperación mediante Supabase.
// src/app/forgot-password/page.tsx
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Image from 'next/image'

export default function ForgotPasswordPage() {
  // Valor del campo de correo electrónico
  const [email, setEmail] = useState('')
  // Mensaje de éxito mostrado tras enviar el correo
  const [message, setMessage] = useState<string | null>(null)
  // Mensaje de error devuelto por Supabase
  const [error, setError] = useState<string | null>(null)
  // Indica si el formulario está enviando la solicitud
  const [loading, setLoading] = useState(false)

  // Envía la solicitud de restablecimiento a Supabase
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Reiniciamos mensajes y activamos el indicador de carga
    setLoading(true)
    setError(null)
    setMessage(null)

    // Llamada a Supabase para enviar el correo con el enlace de recuperación
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    })

    // Finaliza la espera y muestra mensaje según el resultado
    setLoading(false)
    if (err) {
      setError(err.message)
    } else {
      setMessage(
        'Si ese correo está registrado, recibirás un email para restablecer tu contraseña.'
      )
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50 items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md overflow-hidden">
        {/* Logo CyD */}
        <div className="pt-10 pb-6 flex justify-center">
          <Image src="/cyD-logo.svg" alt="CyD Ingeniería" width={56} height={56} className="h-14" />
        </div>
        <div className="px-8 pb-8">
          <h1 className="text-center text-xl font-bold mb-2 text-black">
            Recuperar contraseña
          </h1>
          <p className="text-center text-gray-500 mb-6">
            Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
          </p>

          {error && (
            <p className="text-red-600 text-center mb-4">{error}</p>
          )}
          {message && (
            <p className="text-green-600 text-center mb-4">{message}</p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm text-gray-700 mb-1"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="demo@company.com"
                className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-700 text-black"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#802528] hover:bg-[#6e1e1e] text-white font-semibold py-3 rounded-lg transition"
            >
              {loading ? 'Enviando...' : 'Enviar enlace'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            ¿Recordaste tu contraseña?{' '}
            <a
              href="/login"
              className="text-[#802528] hover:underline font-medium"
            >
              Inicia sesión
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
