import axios from 'axios';

// Tạo instance
const api = axios.create({
  baseURL: 'https://trasua.up.railway.app',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // hoặc từ cookies
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Nếu data là FormData, xóa Content-Type để browser tự set
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor để xử lý lỗi chung
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Xử lý lỗi 401 - Unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login'; // Redirect to login
    }
    return Promise.reject(error);
  }
);

// Các hàm dùng lại instance
export const getData = async (endpoint: string) => {
  const response = await api.get(endpoint);
  return response.data;
};

export const postData = async <T>(endpoint: string, data: T) => {
  const response = await api.post(endpoint, data);
  return response.data;
};

export const putData = async <T>(endpoint: string, data: T) => {
  const response = await api.put(endpoint, data);
  return response.data;
};

export const deleteData = async (endpoint: string) => {
  const response = await api.delete(endpoint);
  return response.data;
};

// Hàm đặc biệt cho FormData (upload files)
export const putFormData = async (endpoint: string, formData: FormData) => {
  const response = await api.put(endpoint, formData);
  return response.data;
};

export const postFormData = async (endpoint: string, formData: FormData) => {
  const response = await api.post(endpoint, formData);
  return response.data;
};

export default api;
