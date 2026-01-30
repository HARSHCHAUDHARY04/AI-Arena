import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type User = { id: string; _id?: string; email: string; role?: UserRole };
type Session = { user: User; access_token: string };
import db from '@/integrations/mongo/client';

type UserRole = 'admin' | 'organizer' | 'participant';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  loading: boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: Error | null; user?: User | null; role?: UserRole | null }>;
  // signUp removed - admin creates users only
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = db.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session);
        setSession(session);
        setUser(session?.user ?? null);

        // Check role from user object or localStorage
        if (session?.user) {
          let userRole = session.user.role as UserRole | undefined;
          if (!userRole) {
            userRole = (localStorage.getItem('ai_arena_role') || 'participant') as UserRole;
          }
          setRole(userRole);
          setLoading(false);
        } else {
          setRole(null);
          setLoading(false);
        }
      }
    );

    // Then check for existing session
    db.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', session);
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        let userRole = session.user.role as UserRole | undefined;
        if (!userRole) {
          userRole = (localStorage.getItem('ai_arena_role') || 'participant') as UserRole;
        }
        setRole(userRole);
        setLoading(false);
      } else {
        setRole(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const result = await db.auth.signInWithPassword({
      email,
      password,
    });

    const error = (result as any).error ?? null;
    const data = (result as any).data;

    // If login successful, immediately update state from returned data
    if (!error && data?.user) {
      const loggedInUser = data.user as User;
      const loggedInRole =
        (loggedInUser.role as UserRole | undefined) ||
        ((localStorage.getItem('ai_arena_role') || 'participant') as UserRole);

      setUser(loggedInUser);
      setRole(loggedInRole);
      setSession({ user: loggedInUser, access_token: data.token });
      setLoading(false);
    }

    // Normalise error into an Error instance for callers
    const normalisedError =
      error instanceof Error
        ? error
        : error && typeof error === 'object'
          ? new Error((error as any).error || 'Login failed')
          : null;

    return {
      error: normalisedError,
      user: data?.user ?? null,
      role: (data?.user?.role as UserRole | undefined) ?? null,
    };
  };

  // signUp removed - admin creates users via edge function

  const signOut = async () => {
    await db.auth.signOut();
    localStorage.removeItem('ai_arena_role');
    setUser(null);
    setSession(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, role, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
