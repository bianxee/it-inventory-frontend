// lib/auth.ts
// Auth utilities — session management tanpa library eksternal

export interface User {
  id:       number;
  name:     string;
  email:    string;
  role:     'admin' | 'staff' | 'viewer';
  avatar:   string;   // initials
  department?: string;
}

export interface Session {
  user:      User;
  token:     string;
  expiresAt: number; // timestamp ms
}

// ─────────────────────────────────────────────────────────────
// MOCK USERS (ganti dengan API call saat backend aktif)
// ─────────────────────────────────────────────────────────────

export const MOCK_USERS: Array<User & { password: string }> = [
  {
    id: 1, name: 'Budi Santoso', email: 'budi@company.com',
    password: 'admin123', role: 'admin', avatar: 'BS', department: 'IT',
  },
  {
    id: 2, name: 'Sari Dewi', email: 'sari@company.com',
    password: 'staff123', role: 'staff', avatar: 'SD', department: 'Finance',
  },
  {
    id: 3, name: 'Andi Pratama', email: 'andi@company.com',
    password: 'viewer123', role: 'viewer', avatar: 'AP', department: 'HR',
  },
];

// ─────────────────────────────────────────────────────────────
// SESSION STORAGE KEY
// ─────────────────────────────────────────────────────────────

const SESSION_KEY = 'it_inventory_session';
const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 jam

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

export function saveSession(user: User): Session {
  const session: Session = {
    user,
    token:     btoa(`${user.id}:${Date.now()}`),
    expiresAt: Date.now() + SESSION_DURATION,
  };
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
  return session;
}

export function getSession(): Session | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session: Session = JSON.parse(raw);
    if (Date.now() > session.expiresAt) {
      clearSession();
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(SESSION_KEY);
  }
}

// ─────────────────────────────────────────────────────────────
// LOGIN FUNCTION
// ─────────────────────────────────────────────────────────────

export async function login(
  email: string,
  password: string
): Promise<{ success: true; user: User } | { success: false; error: string }> {
  // Simulasi network delay
  await new Promise((r) => setTimeout(r, 800));

  // Coba hit API dulu
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1'}/auth/login`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      }
    );
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.user) {
        saveSession(data.user);
        return { success: true, user: data.user };
      }
    }
  } catch {
    // Backend offline — gunakan mock
  }

  // Mock authentication
  const found = MOCK_USERS.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );

  if (!found) {
    return { success: false, error: 'Email atau password salah' };
  }

  const { password: _, ...user } = found;
  saveSession(user);
  return { success: true, user };
}

// ─────────────────────────────────────────────────────────────
// ROLE PERMISSIONS
// ─────────────────────────────────────────────────────────────

export const ROLE_PERMISSIONS = {
  admin:  ['read', 'write', 'delete', 'manage'],
  staff:  ['read', 'write'],
  viewer: ['read'],
} as const;

export function canPerform(role: User['role'], action: string): boolean {
  return (ROLE_PERMISSIONS[role] as readonly string[]).includes(action);
}

export const ROLE_LABEL: Record<User['role'], string> = {
  admin:  'Administrator',
  staff:  'Staff Gudang',
  viewer: 'Viewer',
};

export const ROLE_COLOR: Record<User['role'], string> = {
  admin:  'bg-violet-100 text-violet-700',
  staff:  'bg-emerald-100 text-emerald-700',
  viewer: 'bg-slate-100 text-slate-600',
};
