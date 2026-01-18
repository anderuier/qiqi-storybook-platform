/**
 * 用户认证 Context
 * 管理用户登录状态和认证信息
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  authApi,
  User,
  UserProfile,
  LoginRequest,
  RegisterRequest,
  getToken,
  setToken,
  clearToken,
  ApiError,
} from '../lib/api';

// Context 类型定义
interface AuthContextType {
  // 状态
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // 方法
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: { nickname?: string; avatar?: string }) => Promise<void>;
  changePassword: (data: { oldPassword: string; newPassword: string }) => Promise<void>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
}

// 创建 Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider 组件
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 是否已认证
  const isAuthenticated = !!user;

  // 清除错误
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 刷新用户信息
  const refreshUser = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const profile = await authApi.getMe();
      setUser(profile);
    } catch (err) {
      // Token 无效，清除
      clearToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 初始化：检查登录状态
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // 登录
  const login = useCallback(async (data: LoginRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authApi.login(data);
      setToken(response.token);
      // 获取完整用户信息
      const profile = await authApi.getMe();
      setUser(profile);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 注册
  const register = useCallback(async (data: RegisterRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authApi.register(data);
      setToken(response.token);
      // 获取完整用户信息
      const profile = await authApi.getMe();
      setUser(profile);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 退出登录
  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // 忽略错误
    } finally {
      clearToken();
      setUser(null);
    }
  }, []);

  // 更新用户信息
  const updateProfile = useCallback(
    async (data: { nickname?: string; avatar?: string }) => {
      setError(null);

      try {
        await authApi.updateProfile(data);
        // 刷新用户信息
        await refreshUser();
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError.message);
        throw err;
      }
    },
    [refreshUser]
  );

  // 修改密码
  const changePassword = useCallback(
    async (data: { oldPassword: string; newPassword: string }) => {
      setError(null);

      try {
        await authApi.changePassword(data);
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError.message);
        throw err;
      }
    },
    []
  );

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    clearError,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook：使用认证 Context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook：需要登录的页面保护
export function useRequireAuth(redirectTo: string = '/login') {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = redirectTo;
    }
  }, [isAuthenticated, isLoading, redirectTo]);

  return { isAuthenticated, isLoading };
}
