/**
 * API 客户端封装
 * 统一处理请求、响应、错误和认证
 */

import axios, { AxiosError, AxiosRequestConfig } from 'axios';

// API 基础 URL
const API_BASE_URL = '/api';

// 创建 axios 实例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 2分钟超时，AI 生成需要较长时间
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token 存储 key
const TOKEN_KEY = 'auth_token';

// 获取存储的 token
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

// 保存 token
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

// 清除 token
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// 请求拦截器：添加认证 token
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器：统一处理错误
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error: AxiosError<ApiErrorResponse>) => {
    if (error.response) {
      const { status, data } = error.response;

      // 401 未授权：清除 token 并跳转登录
      if (status === 401) {
        clearToken();
        // 如果不在登录页，跳转到登录页
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }

      // 返回格式化的错误
      return Promise.reject({
        code: data?.error?.code || 'UNKNOWN_ERROR',
        message: data?.error?.message || '请求失败，请稍后重试',
        status,
      });
    }

    // 超时错误
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return Promise.reject({
        code: 'TIMEOUT_ERROR',
        message: '请求超时，AI 正在努力生成中，请稍后重试',
        status: 0,
      });
    }

    // 网络错误
    return Promise.reject({
      code: 'NETWORK_ERROR',
      message: '网络连接失败，请检查网络',
      status: 0,
    });
  }
);

// API 响应类型
export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export interface ApiError {
  code: string;
  message: string;
  status: number;
}

// 通用请求方法
async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.request<any, ApiResponse<T>>(config);
  return response.data;
}

// ============================================
// 用户认证 API
// ============================================

export interface User {
  userId: string;
  email: string;
  nickname: string;
  avatar?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  nickname: string;
}

export interface AuthResponse extends User {
  token: string;
}

export interface UserProfile extends User {
  createdAt: string;
  stats: {
    worksCount: number;
    publishedCount: number;
  };
}

export const authApi = {
  // 登录
  login: (data: LoginRequest) =>
    request<AuthResponse>({ method: 'POST', url: '/auth/login', data }),

  // 注册
  register: (data: RegisterRequest) =>
    request<AuthResponse>({ method: 'POST', url: '/auth/register', data }),

  // 退出登录
  logout: () => request<{ message: string }>({ method: 'POST', url: '/auth/logout' }),

  // 获取当前用户信息
  getMe: () => request<UserProfile>({ method: 'GET', url: '/user/me' }),

  // 更新用户信息
  updateProfile: (data: { nickname?: string; avatar?: string }) =>
    request<User>({ method: 'PUT', url: '/user/profile', data }),

  // 修改密码
  changePassword: (data: { oldPassword: string; newPassword: string }) =>
    request<{ message: string }>({ method: 'PUT', url: '/user/password', data }),
};

// ============================================
// 故事创作 API
// ============================================

export interface CreateStoryRequest {
  mode: 'free' | 'template';
  templateId?: string;
  input: {
    childName: string;
    childAge: number;
    theme?: string;
    keywords?: string[];
    style: 'warm' | 'adventure' | 'funny' | 'educational' | 'fantasy' | 'friendship';
    length: 'short' | 'medium' | 'long';
  };
}

export interface StoryResponse {
  storyId: string;
  workId: string;
  title: string;
  content: string;
  wordCount: number;
  estimatedPages: number;
  aiProvider: string;
  aiModel: string;
}

export interface StoryboardPage {
  pageNumber: number;
  text: string;
  imagePrompt: string;
  duration: number;
}

export interface StoryboardResponse {
  storyboardId: string;
  workId: string;
  pageCount: number;
  pages: StoryboardPage[];
  aiProvider: string;
  aiModel: string;
}

export interface ImageResponse {
  imageId: string;
  imageUrl: string;
  pageNumber: number;
  style: string;
  revisedPrompt?: string;
  provider: string;
  model: string;
}

export interface TaskResponse {
  taskId: string;
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  totalItems: number;
  completedItems: number;
  result?: any;
  error?: string;
}

// 图片生成提供商类型
export type ImageProvider = 'dalle' | 'stability' | 'imagen' | 'jimeng' | 'siliconflow' | 'custom';

export const createApi = {
  // 生成故事
  generateStory: (data: CreateStoryRequest) =>
    request<StoryResponse>({ method: 'POST', url: '/create/story', data }),

  // 生成分镜剧本
  generateStoryboard: (data: { storyContent: string; pageCount?: number; workId: string }) =>
    request<StoryboardResponse>({ method: 'POST', url: '/create/storyboard', data }),

  // 生成单张图片
  generateImage: (data: {
    storyboardId: string;
    pageNumber: number;
    style: string;
    regenerate?: boolean;
    provider?: ImageProvider;
  }) => request<ImageResponse>({ method: 'POST', url: '/create/image', data }),

  // 批量生成图片
  generateImages: (data: { storyboardId: string; style: string; provider?: ImageProvider }) =>
    request<{ taskId: string; status: string; totalPages: number; provider: string }>({
      method: 'POST',
      url: '/create/images',
      data,
    }),

  // 查询任务状态
  getTask: (taskId: string) =>
    request<TaskResponse>({ method: 'GET', url: `/create/task/${taskId}` }),

  // 继续生成下一张图片
  continueTask: (taskId: string) =>
    request<TaskResponse & { pageNumber?: number; imageUrl?: string }>({
      method: 'POST',
      url: `/create/task/${taskId}/continue`,
    }),
};

// ============================================
// 草稿管理 API
// ============================================

export interface Draft {
  id: string;
  title: string;
  status: string;
  currentStep: 'input' | 'story' | 'storyboard' | 'images' | 'completed';
  theme: string;
  childName?: string;
  childAge?: number;
  style?: string;
  length?: string;
  pageCount: number;
  coverUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DraftDetail {
  work: Draft;
  story: {
    id: string;
    content: string;
    wordCount: number;
  } | null;
  storyboard: {
    id: string;
    pages: Array<{
      pageNumber: number;
      text: string;
      imagePrompt: string;
      imageUrl?: string;
      audioUrl?: string;
    }>;
  } | null;
}

export const draftsApi = {
  // 获取草稿列表
  getDrafts: () =>
    request<{ drafts: Draft[] }>({ method: 'GET', url: '/drafts' }),

  // 获取草稿详情
  getDraft: (draftId: string) =>
    request<DraftDetail>({ method: 'GET', url: `/drafts/${draftId}` }),

  // 删除草稿
  deleteDraft: (draftId: string) =>
    request<{ message: string }>({ method: 'DELETE', url: `/drafts/${draftId}` }),
};

// ============================================
// 作品管理 API
// ============================================

export interface Work {
  workId: string;
  title: string;
  coverUrl?: string;
  status: 'draft' | 'published';
  pageCount: number;
  createdAt: string;
  updatedAt: string;
  stats: {
    views: number;
    likes: number;
  };
}

export interface WorkDetail extends Work {
  pages: Array<{
    pageNumber: number;
    text: string;
    imageUrl: string;
    audioUrl?: string;
  }>;
  author: {
    userId: string;
    nickname: string;
    avatar: string;
  };
}

export interface WorksListResponse {
  total: number;
  page: number;
  pageSize: number;
  works: Work[];
}

export const worksApi = {
  // 获取我的作品列表
  getMyWorks: (params?: {
    page?: number;
    pageSize?: number;
    status?: 'all' | 'published' | 'draft';
    sort?: 'newest' | 'oldest';
  }) => request<WorksListResponse>({ method: 'GET', url: '/works', params }),

  // 获取作品详情
  getWork: (workId: string) =>
    request<WorkDetail>({ method: 'GET', url: `/works/${workId}` }),

  // 更新作品
  updateWork: (workId: string, data: { title?: string; coverImageId?: string }) =>
    request<Work>({ method: 'PUT', url: `/works/${workId}`, data }),

  // 删除作品
  deleteWork: (workId: string) =>
    request<{ message: string }>({ method: 'DELETE', url: `/works/${workId}` }),

  // 发布作品
  publishWork: (
    workId: string,
    data: { visibility: 'public' | 'unlisted'; allowComments: boolean }
  ) =>
    request<{ workId: string; status: string; shareUrl: string }>({
      method: 'POST',
      url: `/works/${workId}/publish`,
      data,
    }),

  // 取消发布
  unpublishWork: (workId: string) =>
    request<{ workId: string; status: string }>({
      method: 'POST',
      url: `/works/${workId}/unpublish`,
    }),
};

// ============================================
// 作品广场 API
// ============================================

export interface GalleryWork {
  workId: string;
  title: string;
  coverUrl: string;
  pageCount: number;
  author: {
    userId: string;
    nickname: string;
    avatar: string;
  };
  stats: {
    views: number;
    likes: number;
  };
  createdAt: string;
  isLiked: boolean;
}

export const galleryApi = {
  // 获取作品广场
  getGallery: (params?: {
    sort?: 'hot' | 'newest' | 'featured';
    search?: string;
    page?: number;
    pageSize?: number;
  }) =>
    request<{ total: number; page: number; pageSize: number; works: GalleryWork[] }>({
      method: 'GET',
      url: '/gallery',
      params,
    }),

  // 点赞
  likeWork: (workId: string) =>
    request<{ workId: string; likes: number; isLiked: boolean }>({
      method: 'POST',
      url: `/gallery/${workId}/like`,
    }),

  // 取消点赞
  unlikeWork: (workId: string) =>
    request<{ workId: string; likes: number; isLiked: boolean }>({
      method: 'DELETE',
      url: `/gallery/${workId}/like`,
    }),
};

// ============================================
// 模板 API
// ============================================

export interface Template {
  templateId: string;
  name: string;
  description: string;
  coverUrl: string;
  category: string;
  tags: string[];
  usageCount: number;
  previewPages: number;
}

export interface TemplateDetail extends Template {
  storyOutline: string;
  suggestedStyles: string[];
  previewPages: Array<{
    pageNumber: number;
    text: string;
    imageUrl: string;
  }>;
}

export const templatesApi = {
  // 获取模板列表
  getTemplates: (params?: {
    category?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }) =>
    request<{ total: number; templates: Template[] }>({
      method: 'GET',
      url: '/templates',
      params,
    }),

  // 获取模板详情
  getTemplate: (templateId: string) =>
    request<TemplateDetail>({ method: 'GET', url: `/templates/${templateId}` }),

  // 获取模板分类
  getCategories: () =>
    request<{ categories: Array<{ id: string; name: string; icon: string; count: number }> }>({
      method: 'GET',
      url: '/templates/categories',
    }),
};

export default apiClient;
