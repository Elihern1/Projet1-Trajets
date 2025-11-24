import React, { createContext, useContext, useState, type ReactNode } from 'react';
import type { User } from '@/services/types';
import { createUser, getUserByEmail, updateUserPassword } from '@/services/database';

type RegisterData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (data: RegisterData) => Promise<void>;
  changePassword: (oldPwd: string, newPwd: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  async function login(email: string, password: string) {
    const existing = await getUserByEmail(email);

    if (!existing || existing.password !== password) {
      throw new Error('Email ou mot de passe invalide');
    }

    setUser(existing);
  }

  function logout() {
    setUser(null);
  }

  async function register(data: RegisterData) {
    const existing = await getUserByEmail(data.email);
    if (existing) {
      throw new Error('Un compte existe déjà avec cet email');
    }

    await createUser(data);
    // ici tu peux choisir de connecter auto l'utilisateur
    // ou le laisser retourner au login (on va retourner au login)
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