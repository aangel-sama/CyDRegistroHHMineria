// Página de perfil del usuario.
// Permite cambiar la contraseña estando autenticado.
'use client'

import Sidebar from '../../components/Sidebar'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function ProfilePage() {
  const router = useRouter()
  // Email obtenido de la sesión
  const [email, setEmail] = useState<string>('')
  // Campos de cambio de contraseña
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  // Mensajes de error y éxito
  const [error, setError] = useState<string|null>(null)
  const [success, setSuccess] = useState<string|null>(null)
  // Control de carga inicial
  const [loading, setLoading] = useState(true)

  // 1) Al montar, obtenemos la sesión y el email
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/login')
      } else {
        setEmail(session.user.email || '')
      }
    }).finally(() => setLoading(false))
  }, [router])

  // 2) Al enviar el formulario, validamos y llamamos a Supabase para cambiar la pass
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      setSuccess('Contraseña actualizada correctamente')
      setNewPassword('')
      setConfirmPassword('')
    }
  }

  // Mientras carga, mostramos el sidebar + loader
  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#f8f9fa]">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="text-center text-lg">⏳ Cargando perfil…</div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#f8f9fa]">
      <Sidebar />

      <main className="flex-1 flex justify-center items-start p-8">
        <div className="w-full max-w-md bg-white p-6 shadow rounded-lg">
          <h1 className="text-2xl font-bold mb-4 text-[#212121]">
            Perfil de usuario
          </h1>
          <p className="mb-6 text-gray-700">
            <span className="font-medium">Email:</span> {email}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error   && <p className="text-red-600">{error}</p>}
            {success && <p className="text-green-600">{success}</p>}

            <div>
              <label htmlFor="newPassword" className="block text-sm text-gray-600 mb-1">
                Nueva contraseña
              </label>
              <input
                id="newPassword"
                type="password"
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-700 text-black"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm text-gray-600 mb-1">
                Confirmar contraseña
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-700 text-black"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Actualizando…' : 'Cambiar contraseña'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
