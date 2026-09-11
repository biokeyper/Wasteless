import { AuthUser, getSession, Session, subscribe } from "@/lib/auth";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";

type AuthContextType = {
  session: Session | null;
  user: AuthUser | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // localStorage is read synchronously, so the saved session is available on first render
  const [session, setSession] = useState<Session | null>(getSession);

  useEffect(() => subscribe(setSession), []);

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
