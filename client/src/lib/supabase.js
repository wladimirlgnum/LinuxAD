// Initialisation du client Supabase, unique instance partagee par l'app.
// Les identifiants proviennent des variables d'environnement Vite (prefixe VITE_),
// injectees au build depuis le fichier .env (non versionne).
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    'Configuration Supabase manquante : definissez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans client/.env'
  );
}

export const supabase = createClient(url, anonKey);
