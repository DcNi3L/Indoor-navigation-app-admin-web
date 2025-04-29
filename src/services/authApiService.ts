import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'react-hot-toast';

export const api = axios.create({
  baseURL: process.env.REACT_APP_AUTH_URL,
  withCredentials: true,
});

// ===========================
// 🔹 Обычные запросы (fetchers)
// ===========================
// 🔹 1. Панель: логин
const loginPanelUser = async (data: {
  email: string;
  password: string;
}) => {
  const response = await api.post('/admin/sign-in', data, {
    headers: { 'Content-Type': 'application/json' },
  });
  return response.data;
};

// 🔹 2. Панель: регистрация
const registerPanelUser = async (data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  pictureUrl?: string;
}) => {
  const response = await api.post('/admin/sign-up', data, {
    headers: { 'Content-Type': 'application/json' },
  });
  return response.data;
};

const fetchUserByEmail = async (email: string) => {
  try {
    const res = await api.get('/user', { params: { email } });
    return res.data;
  } catch (error: any) {
    toast.error('User not found');
    throw error;
  }
};

const fetchAllAdmins = async () => {
  try {
    const res = await api.get('/admins');
    return res.data;
  } catch (error: any) {
    toast.error('Failed to load admin list');
    throw error;
  }
};


// ===========================
// 🔹 React Query Hooks
// ===========================
export const usePanelLogin = () => {
  return useMutation({
    mutationFn: async (data: { email: string; password: string }) =>
      await loginPanelUser(data),
    onSuccess: () => toast.success('Login successful'),
    onError: () => toast.error('Login failed'),
  });
};

export const usePanelRegister = () => {
  return useMutation({
    mutationFn: async (data: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      pictureUrl?: string;
    }) => await registerPanelUser(data),
    onSuccess: () => toast.success('Registration successful'),
    onError: () => toast.error('Registration failed'),
  });
};

export const useUserByEmail = (email: string) => {
  return useQuery({
    queryKey: ['user', email],
    queryFn: () => fetchUserByEmail(email),
    enabled: !!email,
    staleTime: 1000 * 60 * 5,
  });
};

export const useAllAdmins = () => {
  return useQuery({
    queryKey: ['admins'],
    queryFn: fetchAllAdmins,
    staleTime: 1000 * 60 * 5,
  });
};
