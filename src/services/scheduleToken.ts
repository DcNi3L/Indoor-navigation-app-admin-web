import { api } from './authApiService';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';

let refreshIntervalId: ReturnType<typeof setInterval> | null = null;

/**
 * Автоматическое обновление accessToken с интервалом 3400 сек (до истечения)
 */
export const scheduleTokenRefresh = () => {
  if (refreshIntervalId) clearInterval(refreshIntervalId);

  refreshIntervalId = setInterval(async () => {
    const refreshToken = Cookies.get('refreshToken');

    if (!refreshToken) {
      toast.error('Refresh token not found. Logging out...');
      logout();
      return;
    }

    try {
      const { data } = await api.get('/reissue-token', {
        headers: {
          Authorization: `Bearer ${refreshToken}`,
        },
      });

      if (data?.accessToken) {
        Cookies.set('accessToken', data.accessToken, { expires: 3400 / 86400 });
        console.log('[Auth] Access token refreshed successfully');
      } else {
        toast.error('Access token missing in response');
        logout();
      }
    } catch (error: any) {
      console.error('[Auth] Token refresh failed:', error);
      toast.error('Session expired. Please log in again.');
      logout();
    }
  }, 3400 * 1000); // ≈ 56 минут 40 сек
};

/**
 * Остановить автообновление токена
 */
export const stopTokenRefresh = () => {
  if (refreshIntervalId) {
    clearInterval(refreshIntervalId);
    refreshIntervalId = null;
  }
};

/**
 * Очистить токены и остановить автообновление
 */
export const logout = () => {
  Cookies.remove('accessToken');
  Cookies.remove('refreshToken');
  Cookies.remove('userEmail');
  Cookies.remove('userId');
  stopTokenRefresh();
  window.location.href = '/login';
};
