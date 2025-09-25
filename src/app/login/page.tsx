// Página de inicio de sesión.
// Permite validar el correo corporativo y autenticarse vía Supabase.
// src/app/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'
import Image from 'next/image'

export default function LoginPage() {
  const router = useRouter()
  // Campo de email del formulario
  const [email, setEmail] = useState('')
  // Contraseña introducida por el usuario
  const [password, setPassword] = useState('')
  // Controla si la contraseña se muestra en texto plano
  const [showPassword, setShowPassword] = useState(false)
  // Mensaje de error en caso de fallo al iniciar sesión
  const [error, setError] = useState<string | null>(null)
  // Indica si la petición está en curso
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Limpiamos mensajes anteriores y validamos el email
    setError(null)

    // Validar que el correo pertenezca al dominio corporativo
    if (!email.endsWith('@cydingenieria.com')) {
      setError('Solo se permite el inicio de sesión con correos @cydingenieria.com')
      return
    }

    setLoading(true)
    // Intentamos iniciar sesión con Supabase
    const { error: err } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    // Finalizar indicador de carga
    setLoading(false)
    if (err) {
      setError(err.message)
    } else {
      router.replace('/registro-horas')
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
          {/* Icono candado */}
          <div className="flex justify-center mb-4">
            <Image src="/candado.svg" alt="Icono de candado" width={24} height={24} className="h-6" />
          </div>
          {/* Título y descripción */}
          <h1 className="text-center text-xl font-bold mb-2 text-black">
            Por favor ingresa tu correo y contraseña
          </h1>
          <p className="text-center text-gray-500 mb-6">
            Ingresa tu correo y contraseña para poder realizar la acción.
          </p>

          {/* Error */}
          {error && (
            <p className="text-red-600 text-center mb-4">{error}</p>
          )}

          {/* Formulario */}
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
                placeholder="tucorreo@cydingenieria.com"
                className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-700 text-black"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm text-gray-700 mb-1"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-700 text-black"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                >
                  {showPassword ? (
                    <Image src="/eye-off.svg" alt="Ocultar contraseña" width={20} height={20} className="h-5" />
                  ) : (
                    <Image src="/eye.svg" alt="Mostrar contraseña" width={20} height={20} className="h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="text-center mb-4">
              <a
                href="/forgot-password"
                className="text-sm text-gray-500 hover:underline"
              >
                ¿Has olvidado tu contraseña?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#802528] hover:bg-[#6e1e1e] text-white font-semibold py-3 rounded-lg transition"
            >
              {loading ? 'Cargando...' : 'Confirmar'}
            </button>
          </form>

          {/* Enlace a registro */}
          <p className="mt-6 text-center text-sm text-gray-600">
            ¿No tienes cuenta?{' '}
            <a
              href="/register"
              className="text-[#802528] hover:underline font-medium"
            >
              Registrarse
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
