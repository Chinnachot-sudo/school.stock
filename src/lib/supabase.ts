import { createClient } from '@supabase/supabase-js';

function getSanitizedConfig() {
  let url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim().replace(/^["']|["']$/g, '');
  let key = (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    ''
  ).trim().replace(/^["']|["']$/g, '');

  // Auto-heal 1: If user accidentally swapped the URL and the Key
  if (url.startsWith('ey') && (key.startsWith('http') || key.includes('supabase'))) {
    const temp = url;
    url = key;
    key = temp;
  }

  // Auto-heal 2: If user entered dashboard URL like https://supabase.com/dashboard/project/wiulvyluvgeeaapbjtvc
  if (url.includes('/project/')) {
    const match = url.match(/\/project\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      url = `https://${match[1]}.supabase.co`;
    }
  }

  // Fallback if URL is empty but key had project URL
  if (!url && key.includes('/project/')) {
    const match = key.match(/\/project\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      url = `https://${match[1]}.supabase.co`;
    }
  }

  return { url, key };
}

const { url: supabaseUrl, key: supabaseKey } = getSanitizedConfig();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

let client: any = null;
if (supabaseUrl && supabaseKey) {
  try {
    client = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
  }
}

export const supabase = client;
