import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import * as api from '../api';
import { User } from '../types';

interface UserContextType {
  users: User[];
  currentUser: User | null;
  authenticated: boolean;
  authRequired: boolean;
  loading: boolean;
  login: (passcode: string) => Promise<void>;
  logout: () => Promise<void>;
  selectUser: (user: User) => Promise<void>;
  refreshUsers: () => Promise<void>;
}

const UserContext = createContext<UserContextType | null>(null);
const SAVED_USER_KEY = 'dinner_decider_user_id';

export function UserProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [authRequired, setAuthRequired] = useState(true);
  const [loading, setLoading] = useState(true);

  const loadUsers = useCallback(async () => {
    const data = await api.getUsers();
    setUsers(data);
    return data;
  }, []);

  // After auth, restore the last-selected member (server is the source of
  // truth; localStorage is just a convenience hint).
  const restoreMember = useCallback(async (members: User[], sessionUser: User | null) => {
    if (sessionUser) {
      setCurrentUser(sessionUser);
      return;
    }
    const saved = localStorage.getItem(SAVED_USER_KEY);
    const found = saved ? members.find((u) => String(u.id) === saved) : undefined;
    if (found) {
      // Best-effort: a stale/invalid saved id must never block login.
      try {
        await api.selectUser(found.id);
        setCurrentUser(found);
      } catch {
        localStorage.removeItem(SAVED_USER_KEY);
      }
    } else if (saved) {
      localStorage.removeItem(SAVED_USER_KEY);
    }
  }, []);

  const bootstrap = useCallback(async () => {
    setLoading(true);
    try {
      const status = await api.getAuthStatus();
      setAuthRequired(status.auth_required);
      setAuthenticated(status.authenticated);
      if (status.authenticated) {
        try {
          const members = await loadUsers();
          await restoreMember(members, status.current_user);
        } catch {
          // member load is best-effort; don't block the app
        }
      }
    } finally {
      setLoading(false);
    }
  }, [loadUsers, restoreMember]);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const login = useCallback(async (passcode: string) => {
    // Only the passcode check (api.login) gates the login. If it throws, the
    // caller shows "incorrect passcode". Everything after is best-effort so a
    // stale saved member or a transient /users error can't fail a valid login.
    const status = await api.login(passcode);
    setAuthenticated(status.authenticated);
    setAuthRequired(status.auth_required);
    try {
      const members = await loadUsers();
      await restoreMember(members, status.current_user);
    } catch {
      // ignore — user can pick their name from the picker
    }
  }, [loadUsers, restoreMember]);

  const logout = useCallback(async () => {
    await api.logout();
    setAuthenticated(false);
    setCurrentUser(null);
  }, []);

  const selectUser = useCallback(async (user: User) => {
    await api.selectUser(user.id);
    setCurrentUser(user);
    localStorage.setItem(SAVED_USER_KEY, String(user.id));
  }, []);

  const refreshUsers = useCallback(async () => {
    await loadUsers();
  }, [loadUsers]);

  return (
    <UserContext.Provider
      value={{
        users,
        currentUser,
        authenticated,
        authRequired,
        loading,
        login,
        logout,
        selectUser,
        refreshUsers,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
