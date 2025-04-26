import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_AUTH_URL,
  withCredentials: true,
});

export const getUserByEmail = async (email: string) => {
  const response = await api.get(`/user`, {
    params: { email },
  });
  return response.data;
};

export const getAllAdmins = async () => {
  const response = await api.get(`/admins`);
  return response.data;
};

export default api;