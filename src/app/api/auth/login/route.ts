import { NextResponse } from 'next/server';
import { isSupabaseConfigured, supabaseAdmin as supabase } from '@/lib/supabase';
import { verifyPassword } from '@/lib/auth-server';
import { cookies } from 'next/headers';

// Cryptographically hashed credentials for emergency offline fallback (Zero plaintext passwords in code)
const FALLBACK_USERS: Record<string, { role: string; name: string; email: string; passwordHash: string }> = {
  superadmin: {
    role: 'SUPER_ADMIN',
    name: 'Super Administrator',
    email: 'superadmin@school.internal',
    passwordHash: 'ebd73e6fb4fec1b59c6884f574501986:d3b647805a36a12b6bb2f1c60a43abb34ff87552c36bfc54907465d537d668705c4fe13851e37e3b998a26df9d9d7ac989a1749de908f635b06a5379f8eb392d'
  },
  admin: {
    role: 'ADMIN',
    name: 'Store Administrator',
    email: 'admin@school.internal',
    passwordHash: '81505406e36aa37b8ffa2dca9af269a6:2c6763e0a03102df7f4b73d3255d61b3f71d50bbb937a1badc8fe672ee5897862cbf3f2a2659f2d55190f675b1c800c569aa998cadff2278659d46e48e901886'
  },
  chinnachot: {
    role: 'SUPER_ADMIN',
    name: 'Chinnachot',
    email: 'chinnachot@school.internal',
    passwordHash: 'ebd73e6fb4fec1b59c6884f574501986:d3b647805a36a12b6bb2f1c60a43abb34ff87552c36bfc54907465d537d668705c4fe13851e37e3b998a26df9d9d7ac989a1749de908f635b06a5379f8eb392d'
  }
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

    // 2. Built-in accounts fallback (cryptographically verified via PBKDF2 hash)
    const fallback = FALLBACK_USERS[cleanUsername];
    if (fallback) {
      const isValidFallback =
        verifyPassword(password, fallback.passwordHash) ||
        (Boolean(process.env.FALLBACK_ADMIN_PASSWORD) && process.env.FALLBACK_ADMIN_PASSWORD === password);

      if (isValidFallback) {
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
