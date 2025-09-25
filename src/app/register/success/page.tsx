// Página mostrada luego de confirmar el registro.
// Ofrece un botón para volver al inicio de sesión.
// src/app/register/success/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function RegisterSuccessPage() {
  // Necesitamos el router para redirigir al usuario al login
  const router = useRouter()

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-8 bg-white">
      <Image src="/logo_cyd.png" alt="Logo CyD" width={100} height={100} />

      <div className="w-full max-w-lg p-6 shadow-lg bg-white text-center">
        <div className="flex items-center justify-center mb-2 text-lg font-medium text-gray-900">
          <Image
            src="/check.png"
            alt="Check"
            width={16}
            height={16}
            className="mr-2"
          />
          ¡Éxito!
        </div>
        <div className="mb-5 text-sm text-gray-600">
          Tu cuenta ha sido confirmada correctamente.
        </div>
        {/* Botón para volver a la pantalla de login */}
        <button
          onClick={() => router.push('/login')}
          className="w-full py-3 text-sm font-medium text-white bg-red-700 rounded-lg hover:bg-red-800 transition"
        >
          Iniciar sesión
        </button>
      </div>
    </div>
  )
}
