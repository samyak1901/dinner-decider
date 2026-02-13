import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getUsers } from '../api';
import { User } from '../types';

interface UserContextType {
  users: User[];
  currentUser: User | null;
  selectUser: (user: User) => void;
}

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    getUsers().then((data) => {
      setUsers(data);
      const saved = localStorage.getItem('dinner_decider_user_id');
      if (saved) {
        const found = data.find((u) => String(u.id) === saved);
        if (found) setCurrentUser(found);
      }
    });
  }, []);

  function selectUser(user: User) {
    setCurrentUser(user);
    localStorage.setItem('dinner_decider_user_id', String(user.id));
  }

  return (
    <UserContext.Provider value={{ users, currentUser, selectUser }}>
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
