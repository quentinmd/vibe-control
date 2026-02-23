"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import type { User, Session } from "@supabase/supabase-js";

// Types
interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  subscription_tier: "free" | "premium" | "pro";
  stripe_customer_id: string | null;
  spotify_user_id: string | null;
  spotify_connected_at: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    fullName?: string,
  ) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(true);
  const profileRequestRef = useRef<Promise<void> | null>(null);
  const profileRequestUserIdRef = useRef<string | null>(null);
  const supabase = createClient();

  const withTimeout = async <T,>(
    promise: PromiseLike<T>,
    timeoutMs = 10000,
  ): Promise<T> => {
    let timeoutId: NodeJS.Timeout | null = null;

    const timeoutPromise = new Promise<T>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error("AUTH_TIMEOUT"));
      }, timeoutMs);
    });

    try {
      return await Promise.race([Promise.resolve(promise), timeoutPromise]);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  };

  // Charger le profil utilisateur
  const loadProfile = async (userId: string): Promise<void> => {
    if (
      profileRequestRef.current &&
      profileRequestUserIdRef.current === userId
    ) {
      await profileRequestRef.current;
      return;
    }

    const requestPromise = (async () => {
      try {
        let profileData: Profile | null = null;

        for (let attempt = 0; attempt < 2; attempt++) {
          let data: Profile | null = null;
          let error: any = null;

          try {
            const result = await withTimeout(
              supabase
                .from("profiles")
                .select(
                  "id, email, full_name, avatar_url, subscription_tier, stripe_customer_id, spotify_user_id, spotify_connected_at, created_at, updated_at",
                )
                .eq("id", userId)
                .single(),
            );
            data = result.data;
            error = result.error;
          } catch (requestError: any) {
            if (requestError?.message === "AUTH_TIMEOUT" && attempt < 1) {
              await new Promise((resolve) => setTimeout(resolve, 600));
              continue;
            }
            throw requestError;
          }

          if (error) {
            if (error.code === "PGRST116" && attempt < 1) {
              await new Promise((resolve) => setTimeout(resolve, 800));
              continue;
            }

            if (error.code === "PGRST116") {
              console.warn("Profile not found after retry for user:", userId);
              if (profile?.id === userId) {
                profileData = profile;
              } else {
                profileData = null;
              }
              break;
            }

            throw error;
          }

          profileData = data;
          break;
        }

        if (!isMountedRef.current) return;
        setProfile(profileData);
      } catch (error) {
        console.error("Error loading profile:", error);
        if (!isMountedRef.current) return;
      } finally {
        if (profileRequestUserIdRef.current === userId) {
          profileRequestRef.current = null;
          profileRequestUserIdRef.current = null;
        }
      }
    })();

    profileRequestUserIdRef.current = userId;
    profileRequestRef.current = requestPromise;
    await requestPromise;
  };

  // Rafraîchir le profil
  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user.id);
    }
  };

  // Initialiser la session
  useEffect(() => {
    isMountedRef.current = true;

    const initializeSession = async () => {
      setLoading(true);
      try {
        const {
          data: { session: initialSession },
        } = await withTimeout(supabase.auth.getSession());

        if (!isMountedRef.current) return;

        setSession(initialSession);
        setUser(initialSession?.user ?? null);

        if (initialSession?.user) {
          await loadProfile(initialSession.user.id);
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error("Error initializing auth session:", error);
        if (!isMountedRef.current) return;
        setSession(null);
        setUser(null);
        setProfile(null);
      } finally {
        if (!isMountedRef.current) return;
        setLoading(false);
      }
    };

    void initializeSession();

    // Écouter les changements d'authentification
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (!isMountedRef.current) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await loadProfile(session.user.id);
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error("Error on auth state change:", error);
        if (!isMountedRef.current) return;
      } finally {
        if (!isMountedRef.current) return;
        setLoading(false);
      }
    });

    return () => {
      isMountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []);

  // Inscription
  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  // Connexion
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  // Connexion avec Google
  const signInWithGoogle = async () => {
    try {
      const redirectUrl =
        process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${redirectUrl}/auth/callback`,
        },
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  // Déconnexion
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const value = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook pour utiliser le contexte d'authentification
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
