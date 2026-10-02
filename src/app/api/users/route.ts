import { NextResponse } from 'next/server';
import { isSupabaseConfigured, supabaseAdmin as supabase } from '@/lib/supabase';
import { hashPassword, requirePermission } from '@/lib/auth-server';
import { can } from '@/lib/auth/permissions';
import { toDbRole, toUiRole, DbRole, UiRole } from '@/lib/auth/roles';
import { AppUser } from '@/types/inventory';
import { logAuditEvent } from '@/lib/audit';

interface RawUserInput {
  username?: unknown;
  password?: unknown;
  name?: unknown;
  email?: unknown;
  role?: unknown;
}

interface ValidatedUser {
  cleanUsername: string;
  password: string;
  name: string;
  email: string;
  dbRole: DbRole;
  uiRole: UiRole;
}

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

export async function GET(request: Request) {
  try {
    const authCheck = await requirePermission(request, 'iam:user:read');
    if (authCheck.errorResponse) {
      return authCheck.errorResponse;
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('app_users')
        .select('id, username, name, email, role, created_at, updated_at')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('GET /api/users Supabase query error:', error);
        return NextResponse.json({ error: 'Failed to retrieve users.' }, { status: 500 });
      }

      if (data) {
        const users: AppUser[] = data.map((row: {
          id: string;
          username: string;
          name: string;
          email?: string;
          role: string;
          created_at?: string;
          updated_at?: string;
        }) => ({
          id: row.id,
          username: row.username,
          name: row.name,
          email: row.email,
          role: toUiRole(row.role),
          createdAt: row.created_at,
          updatedAt: row.updated_at
        }));
        return NextResponse.json({ users });
      }
    }

    // Only fall back to mock users in non-production environments when Supabase is not configured
    if (!isSupabaseConfigured && process.env.NODE_ENV !== 'production') {
      return NextResponse.json({ users: DEFAULT_USERS });
    }

    return NextResponse.json({ users: [] });
  } catch (err: unknown) {
    console.error('GET /api/users error:', err);
    return NextResponse.json(
      { error: 'An unexpected internal error occurred while retrieving users.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const authCheck = await requirePermission(request, 'iam:user:create');
    if (authCheck.errorResponse) {
      return authCheck.errorResponse;
    }
    const caller = authCheck.user;

    const body: unknown = await request.json();

    // Check if batch creation: body.users is an array
    const rawUsers: RawUserInput[] = (body && typeof body === 'object' && 'users' in body && Array.isArray((body as { users: unknown }).users))
      ? ((body as { users: unknown[] }).users as RawUserInput[])
      : [body as RawUserInput];

    if (rawUsers.length === 0) {
      return NextResponse.json({ error: 'No user data provided.' }, { status: 400 });
    }

    // 1. ATOMIC PRE-VALIDATION: validate all users before any inserts
    const validatedUsers: ValidatedUser[] = [];
    const payloadUsernames = new Set<string>();

    for (const u of rawUsers) {
      const username = typeof u.username === 'string' ? u.username : '';
      const password = typeof u.password === 'string' ? u.password : '';
      const name = typeof u.name === 'string' ? u.name : '';
      const email = typeof u.email === 'string' ? u.email : '';
      const roleStr = typeof u.role === 'string' ? u.role : '';

      if (!username || !password || !name) {
        return NextResponse.json(
          { error: `Username, password, and full name are required for user "${name || username || 'unknown'}".` },
          { status: 400 }
        );
      }

      const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');
      if (cleanUsername.length < 3) {
        return NextResponse.json(
          { error: `Username "${cleanUsername}" must be at least 3 characters long.` },
          { status: 400 }
        );
      }

      if (password.length < 8) {
        return NextResponse.json(
          { error: `Password for "${cleanUsername}" must be at least 8 characters long.` },
          { status: 400 }
        );
      }

      const dbRole = toDbRole(roleStr);
      if (!dbRole) {
        return NextResponse.json(
          { error: `Invalid role "${roleStr}" for user "${cleanUsername}". Allowed roles: SUPER_ADMIN, ADMIN, WAREHOUSE, CASHIER, ACCOUNTANT, TEACHER.` },
          { status: 400 }
        );
      }

      // Privilege escalation check: Caller must have 'iam:role:assign' to assign super_admin
      if (dbRole === 'super_admin' && !can(caller, 'iam:role:assign')) {
        return NextResponse.json(
          { error: 'Forbidden: Assigning the SUPER_ADMIN role requires permission "iam:role:assign".' },
          { status: 403 }
        );
      }

      // Duplicate check within batch payload
      if (payloadUsernames.has(cleanUsername)) {
        return NextResponse.json(
          { error: `Duplicate username "${cleanUsername}" found within the request payload.` },
          { status: 400 }
        );
      }
      payloadUsernames.add(cleanUsername);

      validatedUsers.push({
        cleanUsername,
        password,
        name: name.trim(),
        email: email ? email.trim() : `${cleanUsername}@roong-aroon.ac.th`,
        dbRole,
        uiRole: toUiRole(dbRole)
      });
    }

    // Pre-validate existing usernames in DB in one batch query
    if (isSupabaseConfigured && supabase) {
      const usernameList = Array.from(payloadUsernames);
      const { data: existing, error: existingErr } = await supabase
        .from('app_users')
        .select('username')
        .in('username', usernameList);

      if (existingErr) {
        console.error('Error pre-checking usernames in Supabase:', existingErr);
        return NextResponse.json({ error: 'Failed to validate usernames against existing accounts.' }, { status: 500 });
      }

      if (existing && existing.length > 0) {
        const conflicts = (existing as Array<{ username: string }>).map(r => r.username).join(', ');
        return NextResponse.json(
          { error: `Username(s) already taken: ${conflicts}.` },
          { status: 409 }
        );
      }
    }

    // 2. INSERTION PHASE
    const createdUsers: AppUser[] = [];

    for (const item of validatedUsers) {
      const id = `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const { hash } = hashPassword(item.password);

      if (isSupabaseConfigured && supabase) {
        const { data: inserted, error: insertErr } = await supabase
          .from('app_users')
          .insert({
            id,
            username: item.cleanUsername,
            password_hash: hash,
            name: item.name,
            email: item.email,
            role: item.dbRole
          })
          .select('id, username, name, email, role, created_at')
          .single();

        if (insertErr) {
          // Handle Postgres unique constraint violation (code 23505)
          if (insertErr.code === '23505' || insertErr.message?.includes('unique constraint') || insertErr.message?.includes('duplicate key')) {
            return NextResponse.json(
              { error: `Conflict: Username "${item.cleanUsername}" is already taken.` },
              { status: 409 }
            );
          }
          console.error('Failed to insert user into app_users:', insertErr);
          return NextResponse.json(
            { error: 'An unexpected database error occurred while creating the user account.' },
            { status: 500 }
          );
        }

        // Sync into user_roles table with explicit error handling & rollback
        const { error: roleErr } = await supabase.from('user_roles').insert({
          user_id: inserted.id,
          role_id: item.dbRole
        });

        if (roleErr) {
          console.error(`Failed to assign role to user ${inserted.id} in user_roles:`, roleErr);
          // Rollback the app_users record to keep DB consistent
          const { error: deleteErr } = await supabase.from('app_users').delete().eq('id', inserted.id);
          if (deleteErr) {
            console.error(`Failed to rollback user ${inserted.id} from app_users:`, deleteErr);
          }
          return NextResponse.json(
            { error: `Failed to assign role to user "${item.cleanUsername}".` },
            { status: 500 }
          );
        }

        createdUsers.push({
          id: inserted.id,
          username: inserted.username,
          name: inserted.name,
          email: inserted.email,
          role: item.uiRole,
          createdAt: inserted.created_at
        });
      } else {
        createdUsers.push({
          id,
          username: item.cleanUsername,
          name: item.name,
          email: item.email,
          role: item.uiRole
        });
      }
    }

    // 3. AUDIT LOGGING with dynamically resolved actor
    const actorName = caller.name || caller.username || 'System Administrator';
    const userNames = createdUsers.map(u => `${u.name} (@${u.username})`).join(', ');

    logAuditEvent({
      category: 'USER_MANAGEMENT',
      action: createdUsers.length > 1 ? 'BATCH_CREATE_USERS' : 'CREATE_USER',
      details: `Created ${createdUsers.length} staff account(s): ${userNames}`,
      actorName,
      actorEmail: caller.email,
      targetId: createdUsers[0]?.id,
      targetName: createdUsers.length === 1 ? createdUsers[0]?.name : `${createdUsers.length} users`,
      metadata: {
        actorId: caller.id,
        count: createdUsers.length,
        users: createdUsers.map(u => ({ id: u.id, username: u.username, role: u.role }))
      }
    }).catch(e => console.warn('Audit log error:', e));

    return NextResponse.json({
      success: true,
      count: createdUsers.length,
      users: createdUsers,
      user: createdUsers[0]
    });
  } catch (err: unknown) {
    console.error('POST /api/users error:', err);
    return NextResponse.json(
      { error: 'An unexpected internal error occurred while creating user(s). Please try again later.' },
      { status: 500 }
    );
  }
}
