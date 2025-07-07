import React, { useState } from 'react';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth'; // Giả sử đường dẫn này là đúng

function LoginForm() {
  const [email, setEmail] = useState(''); // THAY ĐỔI: Sử dụng state cho 'email'
  const [password, setPassword] = useState('');
  const { signIn, loading } = useSupabaseAuth(); // Lấy hàm signIn và trạng thái loading

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Attempting sign in with Email:', email); // Log email đầy đủ để kiểm tra

    // THAY ĐỔI: Truyền 'email' thay vì 'username' vào hàm signIn
    const { success, error } = await signIn(email, password); 

    if (error) {
      console.error('Sign In Error:', error);
      alert('Login failed: ' + error.message);
    } else if (success) {
      console.log('Login Successful!');
      // Xử lý sau khi đăng nhập thành công (ví dụ: chuyển hướng người dùng đến trang chính)
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="email">Email:</label>
        <input
          id="email"
          type="email" // Đảm bảo type là email để có kiểm tra cơ bản của trình duyệt
          placeholder="Nhập địa chỉ email của bạn" // THAY ĐỔI: Placeholder là email
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="password">Mật khẩu:</label>
        <input
          id="password"
          type="password"
          placeholder="Nhập mật khẩu của bạn"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <button type="submit" disabled={loading}>
        {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
      </button>
    </form>
  );
}

export default LoginForm;