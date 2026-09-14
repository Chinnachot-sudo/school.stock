import { NextResponse } from 'next/server';
import { isSupabaseConfigured, supabaseAdmin as supabase } from '@/lib/supabase';
import { hashPassword } from '@/lib/auth-server';
import { AppUser } from '@/types/inventory';

const DEFAULT_USERS: AppUser[] = [
  {
    id: 'usr-superadmin',
    username: 'superadmin',
    name: 'Super Administrator',
    email: 'superadmin@roong-aroon.ac.th',
    role: 'SUPER_ADMIN'
  },
  {
    id: 'usr-admin',
    username: 'admin',
    name: 'Store Administrator',
    email: 'admin@roong-aroon.ac.th',
    role: 'ADMIN'
  },
  {
    id: 'usr-chinnachot',
    username: 'chinnachot',
    name: 'Chinnachot',
    email: 'chinnachot@roong-aroon.ac.th',
    role: 'SUPER_ADMIN'
  }
];

export async function GET() {
  try {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('app_users')
        .select('id, username, name, email, role, created_at, updated_at')
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        const users: AppUser[] = data.map((row: any) => ({
          id: row.id,
          username: row.username,
          name: row.name,
          email: row.email,
          role: row.role,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        }));
        return NextResponse.json({ users });
      }
    }

    return NextResponse.json({ users: DEFAULT_USERS });
  } catch (err: any) {
    console.error('GET /api/users error:', err);
    return NextResponse.json({ users: DEFAULT_USERS });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password, name, email, role } = body;

    if (!username || !password || !name) {
      return NextResponse.json(
        { error: 'Username, password, and full name are required.' },
        { status: 400 }
      );
    }

    const cleanUsername = String(username).trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');
    if (cleanUsername.length < 3) {
      return NextResponse.json(
        { error: 'Username must be at least 3 characters long (letters, numbers, underscores).' },
        { status: 400 }
      );
    }

    if (String(password).length < 4) {
      return NextResponse.json(
        { error: 'Password must be at least 4 characters.' },
        { status: 400 }
      );
    }

    const validRoles = ['SUPER_ADMIN', 'ADMIN', 'TEACHER'];
    const assignedRole = validRoles.includes(role) ? role : 'ADMIN';

    const id = `usr-${Date.now()}`;
    const { hash } = hashPassword(password);
    const userEmail = email ? String(email).trim() : `${cleanUsername}@roong-aroon.ac.th`;

    if (isSupabaseConfigured && supabase) {
      // Check existing username
      const { data: existing } = await supabase
        .from('app_users')
        .select('id')
        .ilike('username', cleanUsername)
        .maybeSingle();

      if (existing) {
        return NextResponse.json(
          { error: `Username "${cleanUsername}" is already taken.` },
          { status: 409 }
        );
      }

      const { data: inserted, error: insertErr } = await supabase
        .from('app_users')
        .insert({
          id,
          username: cleanUsername,
          password_hash: hash,
          name: String(name).trim(),
          email: userEmail,
          role: assignedRole
        })
        .select('id, username, name, email, role, created_at')
        .single();

      if (insertErr) {
        throw insertErr;
      }

      return NextResponse.json({
        success: true,
        user: {
          id: inserted.id,
          username: inserted.username,
          name: inserted.name,
          email: inserted.email,
          role: inserted.role,
          createdAt: inserted.created_at
        }
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id,
        username: cleanUsername,
        name: String(name).trim(),
        email: userEmail,
        role: assignedRole
      }
    });
  } catch (err: any) {
    console.error('POST /api/users error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to create user.' },
      { status: 500 }
    );
  }
}
