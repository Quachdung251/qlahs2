// src/api/prosecutors.ts

import { supabase } from '../utils/supabase'; // Import supabase client từ file cấu hình chính của nó

// Interface cho Kiểm sát viên
export interface Prosecutor {
  id?: string;
  name: string;
  title: string;
  department?: string;
  user_id?: string; // Cần user_id để liên kết với người dùng tạo
}

// Hàm để lấy dữ liệu Kiểm sát viên từ Supabase (dữ liệu riêng của mỗi user)
export const fetchProsecutors = async (): Promise<Prosecutor[]> => {
  const { data, error } = await supabase
    .from('prosecutors') // Tên bảng của bạn
    .select('*') // Lấy tất cả các cột
    .order('name', { ascending: true }); // Sắp xếp theo tên

  if (error) {
    console.error('Error fetching prosecutors:', error);
    return [];
  }
  return data || [];
};

// Hàm để tìm kiếm Kiểm sát viên (trong dữ liệu riêng của user)
export const searchProsecutors = async (query: string): Promise<Prosecutor[]> => {
  if (!query.trim()) {
    return fetchProsecutors(); // Trả về tất cả nếu không có query
  }

  const searchTerm = `%${query.toLowerCase()}%`;

  const { data, error } = await supabase
    .from('prosecutors')
    .select('*')
    .or(`name.ilike.${searchTerm},title.ilike.${searchTerm},department.ilike.${searchTerm}`);

  if (error) {
    console.error('Error searching prosecutors:', error);
    return [];
  }
  return data || [];
};

// Hàm để thêm Kiểm sát viên mới (vào dữ liệu riêng của user)
export const addProsecutor = async (newProsecutor: Omit<Prosecutor, 'id' | 'user_id'>): Promise<{ success: boolean; error?: any }> => {
  // Vì bạn đã đặt user_id làm DEFAULT VALUE auth.uid() trong DB,
  // bạn không cần truyền user_id từ frontend nữa. Supabase sẽ tự động điền.
  const { data, error } = await supabase
    .from('prosecutors')
    .insert([newProsecutor])
    .select();

  if (error) {
    console.error('Error adding prosecutor:', error);
    return { success: false, error };
  }
  console.log('New prosecutor added:', data);
  return { success: true, data: data[0] };
};

// Bạn có thể thêm các hàm updateProsecutor và deleteProsecutor tại đây nếu cần