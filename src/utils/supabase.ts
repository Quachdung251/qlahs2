import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface UserProfile {
  id: string;
  username: string; // Tên người dùng có thể vẫn là một trường riêng biệt
  role: 'admin' | 'user';
  created_at: string;
}

export const authService = {
  // Thay đổi tham số đầu tiên từ 'username' sang 'email'
  async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email, // Dùng trực tiếp 'email' được truyền vào
      password,
      options: {
        data: {
          // Nếu bạn vẫn muốn lưu 'username' (ví dụ: phần trước @ của email)
          // hoặc một trường username riêng, bạn cần xử lý ở đây
          // Ví dụ: username: email.split('@')[0], 
          role: 'user'
        }
      }
    });
    return { data, error };
  },

  // Thay đổi tham số đầu tiên từ 'username' sang 'email'
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email, // Dùng trực tiếp 'email' được truyền vào
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