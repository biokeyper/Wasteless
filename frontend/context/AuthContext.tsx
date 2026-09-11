import { AuthUser, restoreSession, Session, subscribe } from "@/lib/auth";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

type AuthContextType = {
  session: Session | null;
  user: AuthUser | null;
  // True until the saved session has been read from secure storage
  initializing: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribe(setSession);
    restoreSession()
      .then(setSession)
      .catch(() => setSession(null))
      .finally(() => setInitializing(false));
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider
      value={{ session, user: session?.user ?? null, initializing }}
    >
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
