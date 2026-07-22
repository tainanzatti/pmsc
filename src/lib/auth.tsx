import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import type { Profile } from "./db";

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (params: SignUpParams) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
}

interface SignUpParams {
  email: string;
  password: string;
  fullName: string;
  apelido?: string;
  birthDate?: string;
  cpf?: string;
  telefone?: string;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      if (!mounted) return;
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        loadProfile(data.session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event: string, session: Session | null) => {
        if (!mounted) return;
        setUser(session?.user ?? null);
        if (session?.user) {
          loadProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  async function loadProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      if (error) {
        console.error("Error loading profile:", error);
      }
      setProfile(data as Profile | null);
      setLoading(false);
    } catch (err) {
      console.error("Failed to load profile:", err);
      setLoading(false);
    }
  }

  async function signUp(params: SignUpParams) {
    try {
      const { email, password, fullName, apelido, birthDate, cpf, telefone } = params;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            apelido: apelido || "",
            birth_date: birthDate || "",
            cpf: cpf || "",
            telefone: telefone || "",
            theme_preference: "dark",
          },
        },
      });

      if (error) {
        if (error.message.includes("already registered") || error.message.includes("already been registered")) {
          return { error: "Este e-mail já está cadastrado. Tente fazer login." };
        }
        if (error.message.includes("password")) {
          return { error: "Senha muito fraca. Use pelo menos 6 caracteres." };
        }
        return { error: error.message };
      }

      if (!data.user) {
        return { error: "Falha ao criar conta. Tente novamente." };
      }

      return { error: null };
    } catch (err) {
      console.error("SignUp exception:", err);
      return { error: "Erro de conexão. Verifique sua internet e tente novamente." };
    }
  }

  async function signIn(email: string, password: string) {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          return { error: "E-mail ou senha incorretos." };
        }
        return { error: error.message };
      }
      return { error: null };
    } catch (err) {
      console.error("SignIn exception:", err);
      return { error: "Erro de conexão. Verifique sua internet e tente novamente." };
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }

  async function updateProfile(updates: Partial<Profile>) {
    if (!user) return { error: "Não autenticado" };
    try {
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id);
      if (error) return { error: error.message };
      await refreshProfile();
      return { error: null };
    } catch (err) {
      console.error("Update profile exception:", err);
      return { error: "Erro ao atualizar perfil." };
    }
  }

  async function refreshProfile() {
    if (!user) return;
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    if (error) {
      console.error("Error refreshing profile:", error);
      return;
    }
    setProfile(data as Profile | null);
  }

  const value: AuthContextValue = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
