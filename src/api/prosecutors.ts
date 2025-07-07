// src/api/prosecutors.ts

import { supabase } from '../utils/supabase';

// Interface cho Kiểm sát viên
export interface Prosecutor {
  id?: string; // id là tùy chọn vì khi thêm mới, id sẽ được Supabase tạo
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
// Hàm này sẽ không được dùng trực tiếp trong DataManagement.tsx hiện tại
// nhưng giữ lại nếu bạn muốn thêm tính năng tìm kiếm sau này.
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
export const addProsecutor = async (newProsecutor: Omit<Prosecutor, 'id' | 'user_id'>): Promise<{ success: boolean; data?: Prosecutor; error?: any }> => {
  // Vì bạn đã đặt user_id làm DEFAULT VALUE auth.uid() trong DB,
  // bạn không cần truyền user_id từ frontend nữa. Supabase sẽ tự động điền.
  const { data, error } = await supabase
    .from('prosecutors')
    .insert([newProsecutor])
    .select(); // Thêm .select() để trả về dữ liệu của record đã insert

  if (error) {
    console.error('Error adding prosecutor:', error);
    return { success: false, error };
  }
  console.log('New prosecutor added:', data);
  return { success: true, data: data[0] };
};

// **HÀM MỚI/CẬP NHẬT**
// Hàm để cập nhật Kiểm sát viên
export const updateProsecutor = async (id: string, updatedFields: Partial<Omit<Prosecutor, 'id' | 'user_id'>>): Promise<{ success: boolean; data?: Prosecutor; error?: any }> => {
  const { data, error } = await supabase
    .from('prosecutors')
    .update(updatedFields)
    .eq('id', id)
    .select(); // Thêm .select() để trả về dữ liệu của record đã update

  if (error) {
    console.error('Error updating prosecutor:', error);
    return { success: false, error };
  }
  console.log('Prosecutor updated:', data);
  return { success: true, data: data[0] };
};

// **HÀM MỚI/CẬP NHẬT**
// Hàm để xóa Kiểm sát viên
export const deleteProsecutor = async (id: string): Promise<{ success: boolean; error?: any }> => {
  const { error } = await supabase
    .from('prosecutors')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting prosecutor:', error);
    return { success: false, error };
  }
  console.log('Prosecutor deleted successfully.');
  return { success: true };
};