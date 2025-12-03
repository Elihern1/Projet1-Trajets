import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "firebase/auth";

import {
  getUserProfile,
  listenToAuthChanges,
  logout,
  sendResetPassword,
  signInWithEmail,
  signUpWithEmail,
} from "@/services/firebase";

type UserProfile = {
  uid: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  createdAt?: unknown;
};

type AuthContextType = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ) => Promise<User>;
  signOut: () => Promise<void>;
  sendResetPassword: (email: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchProfile(
  uid: string,
  fallbackEmail?: string
): Promise<UserProfile | null> {
  try {
    const data = await getUserProfile(uid);
    if (data) {
      return {
        uid,
        firstName: data.firstName as string | undefined,
        lastName: data.lastName as string | undefined,
        email: (data.email as string | undefined) ?? fallbackEmail,
        createdAt: data.createdAt,
      };
    }
    return {
      uid,
      email: fallbackEmail,
    };
  } catch (err) {
    console.error("Erreur lors du chargement du profil utilisateur", err);
    return {
      uid,
      email: fallbackEmail,
    };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = listenToAuthChanges(async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        const prof = await fetchProfile(
          firebaseUser.uid,
          firebaseUser.email ?? undefined
        );
        setProfile(prof);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  async function signIn(email: string, password: string): Promise<User> {
    setLoading(true);
    try {
      const credUser = await signInWithEmail(email, password);
      setUser(credUser);

      const prof = await fetchProfile(
        credUser.uid,
        credUser.email ?? email
      );
      setProfile(prof);

      return credUser;
    } finally {
      setLoading(false);
    }
  }

  async function signUp(
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ): Promise<User> {
    setLoading(true);
    try {
      const credUser = await signUpWithEmail(
        email,
        password,
        firstName,
        lastName
      );
      setUser(credUser);

      const prof = await fetchProfile(
        credUser.uid,
        credUser.email ?? email
      );
      setProfile(prof);

      return credUser;
    } finally {
      setLoading(false);
    }
  }

  async function signOut(): Promise<void> {
    setLoading(true);
    try {
      await logout();
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        sendResetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth doit être utilisé dans un AuthProvider");
  }
  return ctx;
}
