// src/services/tokenService.ts
import axios from 'axios';
import Config from '../constants/Config';

export const tokenService = {
  getAccessToken(): string | null {
    try {
      return localStorage.getItem('access');
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  },

  getRefreshToken(): string | null {
    try {
      return localStorage.getItem('refresh');
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  },

  setTokens(access: string, refresh: string): void {
    try {
      localStorage.setItem('access', access);
      localStorage.setItem('refresh', refresh);
      console.log('Tokens saved successfully');
    } catch (error) {
      console.error('Error saving tokens:', error);
    }
  },

  clearTokens(): void {
    try {
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
      console.log('Tokens cleared successfully');
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  },

  async refreshToken(): Promise<string | null> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        console.log('No refresh token available');
        return null;
      }

      console.log('Attempting to refresh token...');
      const response = await axios.post(
        `${Config.API_URL}/auth/jwt/refresh/`,
        { refresh: refreshToken }
      );

      if (response.data.access) {
        this.setTokens(response.data.access, refreshToken);
        console.log('Token refreshed successfully');
        return response.data.access;
      }
      return null;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearTokens();
      return null;
    }
  },

  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000;
      return Date.now() >= exp;
    } catch {
      return true;
    }
  },

  async ensureValidToken(): Promise<string | null> {
    let token = this.getAccessToken();
    
    if (!token) {
      console.log('No token found');
      return null;
    }
    
    if (this.isTokenExpired(token)) {
      console.log('Token expired, attempting refresh...');
      token = await this.refreshToken();
    }
    
    return token;
  }
};