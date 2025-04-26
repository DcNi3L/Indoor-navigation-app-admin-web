import api from "./api";
import Cookies from 'js-cookie';

let refreshIntervalId: ReturnType<typeof setInterval> | null = null;

export const scheduleTokenRefresh = () => {
  if (refreshIntervalId) {
    clearInterval(refreshIntervalId);
  }

  refreshIntervalId = setInterval(async () => {
    const refreshToken = Cookies.get('refreshToken');

    if (!refreshToken) {
      console.error('No refresh token available.');
      logout();
      return;
    }

    try {
      const response = await api.get('/reissue-token', {
        headers: {
          Authorization: `${refreshToken}`,
        },
      });

      if (response.status === 200) {
        const { accessToken } = response.data;
        Cookies.set('accessToken', accessToken, { expires: 3400 / 86400 });
        console.log('Access token refreshed successfully');
      } else {
        console.error('Failed to refresh token, logging out...');
        logout();
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      logout();
    }
  }, 3400 * 1000);
};

export const stopTokenRefresh = () => {
  if (refreshIntervalId) {
    clearInterval(refreshIntervalId);
    refreshIntervalId = null;
  }
};

const logout = () => {
  Cookies.remove('accessToken');
  Cookies.remove('refreshToken');
  Cookies.remove('userEmail');
  stopTokenRefresh();
};
