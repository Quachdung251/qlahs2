import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://your-project-url.supabase.co';
const supabaseKey = 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface UserProfile {
  id: string;
  username: string;
  role: 'admin' | 'user';
  created_at: string;
}

export const authService = {
  async signUp(username: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email: `${username}@legal-system.local`,
      password,
      options: {
        data: {
          username,
          role: 'user'
        }
      }
    });
    return { data, error };
  },

  async signIn(username: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: `${username}@legal-system.local`,
      password
    });
    return { data, error };
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  async updatePassword(newPassword: string) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });
    return { data, error };
  }
};