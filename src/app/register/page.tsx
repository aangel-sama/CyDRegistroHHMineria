// Página de registro de usuarios nuevos.
// Valida el correo corporativo y envía confirmación vía Supabase.
// src/app/register/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Image from 'next/image'

export default function RegisterPage() {
  const router = useRouter();
  // Datos del formulario de registro
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  // Estado y mensajes de error
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validaciones básicas antes de registrar el usuario
    if (!email.endsWith("@cydingenieria.com")) {
      setError("Solo se permiten correos @cydingenieria.com");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }
    // Llamada a Supabase para crear el usuario
    setLoading(true);
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/register/success`,
      },
    });
    // Fin de la llamada
    setLoading(false);
    if (err) {
      setError(err.message);
    } else {
      alert("Revisa tu correo para confirmar tu cuenta.");
      router.replace("/login");
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md overflow-hidden">
        {/* Logo CyD */}
        <div className="pt-10 pb-6 flex justify-center">
          <Image src="/cyD-logo.svg" alt="CyD Ingeniería" width={56} height={56} className="h-14" />
        </div>
        <div className="px-8 pb-8">
          <h2 className="text-center text-xl font-bold mb-4 text-black">
            Crea tu cuenta
          </h2>
          {error && <p className="text-red-600 text-center mb-4">{error}</p>}
          <form onSubmit={handleRegister} className="space-y-4">
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
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-700 text-black"
              />
            </div>

            <div>
              <label
                htmlFor="confirm"
                className="block text-sm text-gray-700 mb-1"
              >
                Confirmar Contraseña
              </label>
              <input
                id="confirm"
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-700 text-black"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#802528] hover:bg-[#6e1e1e] text-white font-semibold py-3 rounded-lg transition"
            >
              {loading ? "Registrando..." : "Registrarse"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            ¿Ya tienes cuenta?{" "}
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
  );
}
