import { NextResponse } from 'next/server';
import { isSupabaseConfigured, supabaseAdmin as supabase } from '@/lib/supabase';
import { verifyPassword } from '@/lib/auth-server';
import { cookies } from 'next/headers';

const FALLBACK_USERS: Record<string, { role: string; name: string; email: string; pass: string }> = {
  superadmin: { role: 'SUPER_ADMIN', name: 'Super Administrator', email: 'superadmin@roong-aroon.ac.th', pass: 'rais2026' },
  admin: { role: 'ADMIN', name: 'Store Administrator', email: 'admin@roong-aroon.ac.th', pass: 'admin2026' },
  chinnachot: { role: 'SUPER_ADMIN', name: 'Chinnachot', email: 'chinnachot@roong-aroon.ac.th', pass: 'rais2026' }
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Please provide both username and password.' },
        { status: 400 }
      );
    }

    const cleanUsername = String(username).trim().toLowerCase();

    // 1. Try Supabase app_users table
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: userRow, error } = await supabase
          .from('app_users')
          .select('*')
          .ilike('username', cleanUsername)
          .maybeSingle();

        if (userRow) {
          const isValid = verifyPassword(password, userRow.password_hash);
          if (isValid) {
            const userObj = {
              id: userRow.id,
              username: userRow.username,
              name: userRow.name,
              email: userRow.email || `${userRow.username}@roong-aroon.ac.th`,
              role: userRow.role
            };

            const cookieStore = await cookies();
            cookieStore.set('school_user', JSON.stringify(userObj), {
              path: '/',
              httpOnly: false,
              sameSite: 'lax',
              maxAge: 60 * 60 * 24 * 7 // 7 days
            });

            return NextResponse.json({ success: true, user: userObj });
          }
        }
      } catch (dbErr) {
        console.warn('Database user lookup failed, falling back to built-in accounts:', dbErr);
      }
    }

    // 2. Built-in accounts fallback
    const fallback = FALLBACK_USERS[cleanUsername];
    if (fallback && fallback.pass === password) {
      const userObj = {
        id: `usr-${cleanUsername}`,
        username: cleanUsername,
        name: fallback.name,
        email: fallback.email,
        role: fallback.role
      };

      const cookieStore = await cookies();
      cookieStore.set('school_user', JSON.stringify(userObj), {
        path: '/',
        httpOnly: false,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7
      });

      return NextResponse.json({ success: true, user: userObj });
    }

    return NextResponse.json(
      { error: 'Invalid username or password. Please check your credentials.' },
      { status: 401 }
    );
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error during login' },
      { status: 500 }
    );
  }
}
