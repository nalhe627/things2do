import { supabase } from "@/utils/supabase";

export interface SignUpCredentials {
  email: string;
  password: string;
  fullName?: string;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

export const authApi = {
  // Sign up a new user
  signUp: async ({ email, password, fullName }: SignUpCredentials) => {
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

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  // Sign in existing user
  signIn: async ({ email, password }: SignInCredentials) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  // Sign out
  signOut: async () => {
    try {
      // First check if we have a session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        console.log("No active session to sign out from");
        return { error: null };
      }

      console.log("Signing out user:", session.user?.email);

      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      console.log("Sign out successful");
      return { error: null };
    } catch (error: any) {
      console.error("Sign out error:", error);
      return { error: error.message };
    }
  },

  // Get current session
  getSession: async () => {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error) throw error;
      return { session, error: null };
    } catch (error: any) {
      return { session: null, error: error.message };
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) throw error;
      return { user, error: null };
    } catch (error: any) {
      return { user: null, error: error.message };
    }
  },
};
