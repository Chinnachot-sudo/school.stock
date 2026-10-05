import { NextResponse } from 'next/server';
import { isSupabaseConfigured, supabaseAdmin as supabase } from '@/lib/supabase';
import { verifyPassword } from '@/lib/auth-server';
import { UserRole } from '@/types/inventory';
import { cookies } from 'next/headers';
import { getUserPermissions } from '@/lib/auth/permissions';
import { signSession } from '@/lib/session';
import { logAuditEvent } from '@/lib/audit';

// In-memory rate limiting and account lockout store
interface LoginAttemptRecord {
  failedAttempts: number;
  firstAttemptTime: number;
  lockedUntil?: number;
}

const loginAttempts = new Map<string, LoginAttemptRecord>();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function getClientIdentifier(request: Request, username: string): string {
  const forwarded = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
  const ip = forwarded.split(',')[0].trim();
  return `${ip}:${username.toLowerCase()}`;
}

function checkRateLimit(key: string): { isLocked: boolean; remainingMinutes?: number } {
  const record = loginAttempts.get(key);
  if (!record) return { isLocked: false };

  const now = Date.now();

  // Check if currently locked
  if (record.lockedUntil && record.lockedUntil > now) {
    const remainingMinutes = Math.ceil((record.lockedUntil - now) / 60000);
    return { isLocked: true, remainingMinutes };
  }

  // Reset if window has passed
  if (now - record.firstAttemptTime > ATTEMPT_WINDOW_MS) {
    loginAttempts.delete(key);
    return { isLocked: false };
  }

  return { isLocked: false };
}

function recordFailedAttempt(key: string): { isNowLocked: boolean; attemptsLeft: number } {
  const now = Date.now();
  const record = loginAttempts.get(key) || { failedAttempts: 0, firstAttemptTime: now };

  if (now - record.firstAttemptTime > ATTEMPT_WINDOW_MS) {
    record.failedAttempts = 1;
    record.firstAttemptTime = now;
    delete record.lockedUntil;
  } else {
    record.failedAttempts += 1;
  }

  if (record.failedAttempts >= MAX_FAILED_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS;
    loginAttempts.set(key, record);
    return { isNowLocked: true, attemptsLeft: 0 };
  }

  loginAttempts.set(key, record);
  return { isNowLocked: false, attemptsLeft: MAX_FAILED_ATTEMPTS - record.failedAttempts };
}

function clearFailedAttempts(key: string) {
  loginAttempts.delete(key);
}

// Cryptographically hashed credentials for emergency offline fallback (Zero plaintext passwords in code)
const FALLBACK_USERS: Record<string, { role: string; name: string; email: string; passwordHash: string }> = {
  superadmin: {
    role: 'super_admin',
    name: 'Super Administrator',
    email: 'superadmin@school.internal',
    passwordHash: 'ebd73e6fb4fec1b59c6884f574501986:d3b647805a36a12b6bb2f1c60a43abb34ff87552c36bfc54907465d537d668705c4fe13851e37e3b998a26df9d9d7ac989a1749de908f635b06a5379f8eb392d'
  },
  admin: {
    role: 'legacy_admin',
    name: 'Store Administrator',
    email: 'admin@school.internal',
    passwordHash: '81505406e36aa37b8ffa2dca9af269a6:2c6763e0a03102df7f4b73d3255d61b3f71d50bbb937a1badc8fe672ee5897862cbf3f2a2659f2d55190f675b1c800c569aa998cadff2278659d46e48e901886'
  },
  chinnachot: {
    role: 'super_admin',
    name: 'Chinnachot',
    email: 'chinnachot@school.internal',
    passwordHash: 'ebd73e6fb4fec1b59c6884f574501986:d3b647805a36a12b6bb2f1c60a43abb34ff87552c36bfc54907465d537d668705c4fe13851e37e3b998a26df9d9d7ac989a1749de908f635b06a5379f8eb392d'
  }
};

function normalizeRole(role: string): UserRole {
  const r = (role || '').trim().toLowerCase();
  if (r === 'super_admin' || r === 'superadmin') return 'super_admin';
  if (r === 'admin' || r === 'legacy_admin' || r === 'inventory_manager') return 'admin';
  if (r === 'warehouse') return 'warehouse';
  if (r === 'cashier') return 'cashier';
  if (r === 'accountant') return 'accountant';
  return 'teacher';
}

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

    const cleanInput = String(username).trim().toLowerCase();
    const clientKey = getClientIdentifier(request, cleanInput);

    // Check rate limit / account lockout
    const rateCheck = checkRateLimit(clientKey);
    if (rateCheck.isLocked) {
      logAuditEvent({
        category: 'SECURITY',
        action: 'ACCOUNT_LOCKED_ATTEMPT',
        details: `Login attempt to locked account: ${cleanInput}`,
        actorName: cleanInput,
        metadata: { username: cleanInput, remainingMinutes: rateCheck.remainingMinutes }
      }).catch(() => {});

      return NextResponse.json(
        { error: `Account is temporarily locked due to too many failed attempts. Please try again in ${rateCheck.remainingMinutes} minutes.` },
        { status: 429 }
      );
    }

    // 1. Try Supabase app_users table (matches either username or email)
    let userRow: {
      id: string;
      username: string;
      name: string;
      email?: string;
      role: string;
      password_hash: string;
      created_at?: string;
      updated_at?: string;
    } | null = null;

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: userRows } = await supabase
          .from('app_users')
          .select('*')
          .or(`username.eq.${cleanInput.replace(/[^a-z0-9_.@-]/g, '')},email.eq.${cleanInput.replace(/[^a-z0-9_.@+-]/g, '')}`) 
          .limit(1);

        if (userRows && userRows.length > 0) {
          const row = userRows[0];
          userRow = row;
          const isValid = verifyPassword(password, row.password_hash);
          if (isValid) {
            clearFailedAttempts(clientKey);
            const userRole = normalizeRole(row.role || 'teacher');
            const perms = getUserPermissions({
              id: row.id,
              username: row.username,
              name: row.name,
              role: userRole
            });

            const userObj = {
              id: row.id,
              username: row.username,
              name: row.name,
              email: row.email || `${row.username}@roong-aroon.ac.th`,
              role: userRole,
              roles: [userRole],
              permissions: perms
            };

            const sessionToken = signSession({
              userId: userObj.id,
              username: userObj.username,
              name: userObj.name,
              email: userObj.email,
              role: userObj.role,
              roles: userObj.roles,
              permissions: userObj.permissions
            });

            const cookieStore = await cookies();
            cookieStore.set('school_session', sessionToken, {
              path: '/',
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              maxAge: 60 * 60 * 24 * 7 // 7 days
            });

            cookieStore.set('school_user', encodeURIComponent(JSON.stringify(userObj)), {
              path: '/',
              httpOnly: false,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              maxAge: 60 * 60 * 24 * 7
            });

            logAuditEvent({
              category: 'SECURITY',
              action: 'LOGIN_SUCCESS',
              details: `User ${userObj.username} (${userObj.role}) logged in successfully`,
              actorName: userObj.name,
              actorEmail: userObj.email,
              targetId: userObj.id,
              targetName: userObj.username
            }).catch(() => {});

            return NextResponse.json({ success: true, user: userObj });
          }
        }
      } catch (dbErr) {
        console.warn('Database user lookup error:', dbErr);
      }
    }

    // 2. Built-in accounts fallback (Allowed ONLY in development or when Supabase DB is offline/unconfigured)
    const isEmergencyFallbackAllowed =
      process.env.NODE_ENV === 'development' ||
      !isSupabaseConfigured ||
      process.env.ALLOW_EMERGENCY_FALLBACK === 'true';

    if (isEmergencyFallbackAllowed) {
      const fallbackKey = Object.keys(FALLBACK_USERS).find(
        k => k.toLowerCase() === cleanInput || FALLBACK_USERS[k].email.toLowerCase() === cleanInput
      );
      const fallback = fallbackKey ? FALLBACK_USERS[fallbackKey] : undefined;
      const resolvedUsername = fallbackKey || (userRow ? userRow.username : cleanInput);

      if (fallback) {
        const isValidFallback = verifyPassword(password, fallback.passwordHash);

        if (isValidFallback) {
          clearFailedAttempts(clientKey);
          const userRole = normalizeRole(fallback.role);
          const perms = getUserPermissions({
            id: userRow?.id || `usr-${resolvedUsername}`,
            username: resolvedUsername,
            name: userRow?.name || fallback.name,
            role: userRole
          });

          const userObj = {
            id: userRow?.id || `usr-${resolvedUsername}`,
            username: resolvedUsername,
            name: userRow?.name || fallback.name,
            email: userRow?.email || fallback.email,
            role: userRole,
            roles: [userRole],
            permissions: perms
          };

          const sessionToken = signSession({
            userId: userObj.id,
            username: userObj.username,
            name: userObj.name,
            email: userObj.email,
            role: userObj.role,
            roles: userObj.roles,
            permissions: userObj.permissions
          });

          const cookieStore = await cookies();
          cookieStore.set('school_session', sessionToken, {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7
          });

          cookieStore.set('school_user', encodeURIComponent(JSON.stringify(userObj)), {
            path: '/',
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7
          });

          logAuditEvent({
            category: 'SECURITY',
            action: 'LOGIN_SUCCESS',
            details: `Fallback user ${userObj.username} (${userObj.role}) logged in successfully`,
            actorName: userObj.name,
            actorEmail: userObj.email,
            targetId: userObj.id,
            targetName: userObj.username
          }).catch(() => {});

          return NextResponse.json({ success: true, user: userObj });
        }
      }
    }

    // Record failed login and evaluate lockout
    const failureResult = recordFailedAttempt(clientKey);

    logAuditEvent({
      category: 'SECURITY',
      action: 'LOGIN_FAILURE',
      details: `Failed login attempt for username: ${cleanInput}${failureResult.isNowLocked ? ' (Account locked)' : ''}`,
      actorName: cleanInput,
      metadata: { username: cleanInput, attemptsLeft: failureResult.attemptsLeft, isLocked: failureResult.isNowLocked }
    }).catch(() => {});

    if (failureResult.isNowLocked) {
      return NextResponse.json(
        { error: 'Account locked due to 5 consecutive failed login attempts. Please try again in 15 minutes.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: `Invalid username, email, or password. (${failureResult.attemptsLeft} attempts remaining before lockout)` },
      { status: 401 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during login.' },
      { status: 500 }
    );
  }
}
