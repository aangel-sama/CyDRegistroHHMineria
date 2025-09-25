// Instancia única del cliente de Supabase utilizada en toda la app.
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  // URL y clave anónima se obtienen de variables de entorno públicas
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
