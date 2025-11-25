import {
  createUser,
  getUserByEmail,
  updateUserPassword,
} from '@/services/database.native';
import type { User } from '@/services/types';
import React, {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react';

type RegisterData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (data: RegisterData) => Promise<void>;
  changePassword: (oldPwd: string, newPwd: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  async function login(email: string, password: string) {
    setLoading(true);
    try {
      const existing = await getUserByEmail(email);

      if (!existing || existing.password !== password) {
        throw new Error('Email ou mot de passe invalide');
      }

      setUser(existing);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    setUser(null);
  }

  async function register(data: RegisterData) {
    setLoading(true);
    try {
      const existing = await getUserByEmail(data.email);
      if (existing) {
        throw new Error('Un compte existe déjà avec cet email');
      }

      await createUser(data);
      // Tu peux soit connecter automatiquement, soit laisser revenir au login
      // Ici on laisse l'utilisateur revenir au login
    } finally {
      setLoading(false);
    }
  }

  async function changePassword(oldPwd: string, newPwd: string) {
    if (!user) {
      throw new Error('Vous devez être connecté');
    }

    if (user.password !== oldPwd) {
      throw new Error('Ancien mot de passe incorrect');
    }

    await updateUserPassword(user.id, newPwd);
    setUser({ ...user, password: newPwd });
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        register,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return ctx;
}