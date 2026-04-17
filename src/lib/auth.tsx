import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User, signInWithEmailAndPassword } from "firebase/auth";

const AuthContext = createContext<{ 
  user: User | null; 
  loading: boolean; 
  signIn: () => void; 
  signInEmail: (email: string, pass: string) => Promise<void>;
  logOut: () => void 
}>({
  user: null,
  loading: true,
  signIn: () => {},
  signInEmail: async () => {},
  logOut: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for demo session first
    const isDemo = localStorage.getItem('auth_demo_session') === 'true';
    if (isDemo) {
      setUser({
        email: "admin@translog-pro.com",
        uid: "demo-admin-uid",
        displayName: "Administrateur Démo",
        emailVerified: true,
      } as User);
      setLoading(false);
    }

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (!isDemo) {
        setUser(u);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      localStorage.removeItem('auth_demo_session');
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in", error);
    }
  };

  const signInEmail = async (email: string, pass: string) => {
    // Demo bypass for the requested account
    if (email === "admin" && pass === "123456") {
      setUser({
        email: "admin@translog-pro.com",
        uid: "demo-admin-uid",
        displayName: "Administrateur Démo",
        emailVerified: true,
      } as User);
      setLoading(false);
      localStorage.setItem('auth_demo_session', 'true');
      return;
    }

    try {
      localStorage.removeItem('auth_demo_session');
      const finalEmail = email.includes('@') ? email : `${email}@demo.com`;
      await signInWithEmailAndPassword(auth, finalEmail, pass);
    } catch (error) {
      console.error("Error signing in with email", error);
      throw error;
    }
  };

  const logOut = async () => {
    localStorage.removeItem('auth_demo_session');
    await signOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signInEmail, logOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
