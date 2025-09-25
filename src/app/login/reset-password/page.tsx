// Página para ingresar una nueva contraseña.
// Se accede desde el enlace enviado al correo de recuperación.
"use client";

// a
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Image from 'next/image'


export default function ResetPasswordPage() {
  const router = useRouter();

  // Tokens obtenidos desde el hash de la URL
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  // Contraseña ingresada por el usuario
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  // Mensaje de error y estado de carga
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 1. Extraer access_token y refresh_token del hash de la URL al montarse
  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    const params = new URLSearchParams(hash);
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");

    if (access_token && refresh_token) {
      setToken(access_token);
      setRefreshToken(refresh_token);
    } else {
      setError("No se encontró token válido para restablecer la contraseña.");
    }
  }, []);

  // 2. Cuando se envía el formulario, primero establecemos la sesión y luego actualizamos la contraseña
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token || !refreshToken) {
      setError("El token de recuperación no es válido.");
      return;
    }

    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    // 2.1. Llamamos a setSession para "logear" al usuario con ese token
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: token,
      refresh_token: refreshToken,
    });

    if (sessionError) {
      setLoading(false);
      setError("No se pudo establecer la sesión: " + sessionError.message);
      return;
    }

    // 2.2. Una vez establecida la sesión, actualizamos la contraseña
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (updateError) {
      setError("Error al actualizar la contraseña: " + updateError.message);
    } else {
      // Contraseña cambiada con éxito: redirigimos a /login
      router.replace("/login");
    }
  };

  // 3. Si hay error antes de tener token, mostramos mensaje
  if (error && !token) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="bg-white p-6 rounded-lg shadow text-red-600">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // 4. Formulario de nueva contraseña
  return (
    <div className="flex min-h-screen bg-gray-50 items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md overflow-hidden">
        <div className="pt-10 pb-6 flex justify-center">
          <Image src="/cyD-logo.svg" alt="CyD Ingeniería" width={56} height={56} className="h-14" />
        </div>
        <div className="px-8 pb-8">
          <h2 className="text-center text-xl font-bold mb-4 text-black">
            Cambia tu contraseña
          </h2>
          {error && <p className="text-red-600 text-center mb-4">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="password"
                className="block text-sm text-gray-700 mb-1"
              >
                Nueva contraseña
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
                Repite la contraseña
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
              className="w-full bg-red-700 hover:bg-red-800 text-white font-semibold py-3 rounded-lg transition"
            >
              {loading ? "Actualizando…" : "Cambiar contraseña"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
