import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
    baseURL: process.env.REACT_APP_INDOOR_URL,
    withCredentials: true,
});

api.interceptors.request.use((config) => {
    const token = "kuXzD_vPAUY1I575fmm9Ww9Lk-FaWEOg"
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;