import { createClient } from '@supabase/supabase-js';

function getSanitizedConfig() {
  let url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim().replace(/^["']|["']$/g, '');
  let key = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
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

  // Auto-heal 3: If user typed .supabase.com instead of .supabase.co
  if (url.includes('.supabase.com')) {
    url = url.replace('.supabase.com', '.supabase.co');
  }

  return { url, key };
}

const { url: supabaseUrl, key: supabaseKey } = getSanitizedConfig();

const serverApiKey = (
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  ''
).trim().replace(/^["']|["']$/g, '');

export const isSupabaseConfigured = Boolean(supabaseUrl && (supabaseKey || serverApiKey));

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

// Service role client for server API routes (bypasses Row-Level Security)
let adminClient: any = null;
if (supabaseUrl && serverApiKey) {
  try {
    adminClient = createClient(supabaseUrl, serverApiKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  } catch (err) {
    console.error('Failed to initialize Supabase Admin client:', err);
  }
}

// Never silently use the public/anon client for privileged server operations.
export const supabaseAdmin = adminClient;
export const isServiceRoleConfigured = Boolean(adminClient);
