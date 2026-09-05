'use client';

import { useState, useEffect, useCallback } from 'react';
import { User, AuthState } from '@/types';
import { api } from '@/lib/api';

export function useAuth() {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    const token = localStorage.getItem('chitibazaar_token');
    const userStr = localStorage.getItem('chitibazaar_user');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        setAuth({ user, token, isAuthenticated: true, isLoading: false });
      } catch {
        setAuth({ user: null, token: null, isAuthenticated: false, isLoading: false });
      }
    } else {
      setAuth({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  }, []);

  const sendOtp = useCallback(async (phone: string) => {
    const res = await api.post<{ success: boolean; otp?: string }>('/api/auth/send-otp', { phone });
    return res;
  }, []);

  const verifyOtp = useCallback(async (phone: string, otp: string) => {
    const res = await api.post<{ success: boolean; data: { user: User; token: string } }>(
      '/api/auth/verify-otp',
      { phone, otp }
    );
    
    if (res.success) {
      localStorage.setItem('chitibazaar_token', res.data.token);
      localStorage.setItem('chitibazaar_user', JSON.stringify(res.data.user));
      localStorage.setItem('chitibazaar_role', res.data.user.role);
      setAuth({
        user: res.data.user,
        token: res.data.token,
        isAuthenticated: true,
        isLoading: false,
      });
    }
    
    return res;
  }, []);

  const register = useCallback(
    async (phone: string, name: string, role: 'customer' | 'vendor', ref?: string, acceptPrivacy?: boolean) => {
      const res = await api.post<{ success: boolean; data: { user: User; token: string } }>(
        '/api/auth/register',
        { phone, name, role, ref: ref || undefined, acceptPrivacy: acceptPrivacy === true }
      );

      if (res.success) {
        localStorage.setItem('chitibazaar_token', res.data.token);
        localStorage.setItem('chitibazaar_user', JSON.stringify(res.data.user));
        localStorage.setItem('chitibazaar_role', res.data.user.role);
        setAuth({
          user: res.data.user,
          token: res.data.token,
          isAuthenticated: true,
          isLoading: false,
        });
      }

      return res;
    },
    []
  );

  const logout = useCallback(() => {
    localStorage.removeItem('chitibazaar_token');
    localStorage.removeItem('chitibazaar_user');
    localStorage.removeItem('chitibazaar_role');
    setAuth({ user: null, token: null, isAuthenticated: false, isLoading: false });
  }, []);

  const deleteAccount = useCallback(async () => {
    const token = localStorage.getItem('chitibazaar_token') || undefined;
    const res = await api.delete<{ success: boolean; message: string }>(
      '/api/auth/account',
      token
    );
    // The account is gone even on a soft failure of this helper; clear locally.
    logout();
    return res;
  }, [logout]);

  return { ...auth, sendOtp, verifyOtp, register, deleteAccount, logout };
}
