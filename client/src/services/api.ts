import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse } from '../types';

class ApiService {
    private api: AxiosInstance;
    private isRefreshing = false;
    private failedQueue: Array<{
        resolve: (value?: any) => void;
        reject: (reason?: any) => void;
    }> = [];

    constructor() {
        this.api = axios.create({
            baseURL: 'https://localhost:3000/api', // Point to Proxy/Same Origin
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Request interceptor to add auth token and session token
        this.api.interceptors.request.use(
            (config) => {
                const token = localStorage.getItem('token');
                const sessionToken = localStorage.getItem('sessionToken');

                console.log('[API Request]', config.url, {
                    hasToken: !!token,
                    hasSessionToken: !!sessionToken,
                    token: token ? token.substring(0, 20) + '...' : null
                });

                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }

                if (sessionToken) {
                    config.headers['x-session-token'] = sessionToken;
                }

                return config;
            },
            (error) => Promise.reject(error)
        );

        // Response interceptor for error handling and token refresh
        this.api.interceptors.response.use(
            (response) => response,
            async (error: AxiosError<ApiResponse>) => {
                const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

                // If error is 401 and we haven't retried yet
                if (error.response?.status === 401 && !originalRequest._retry) {
                    const errorMessage = error.response?.data?.message || '';

                    // Don't try to refresh for these errors - they indicate the credentials are invalid
                    const shouldNotRefresh =
                        errorMessage.includes('Invalid credentials') ||
                        errorMessage.includes('No token provided') ||
                        errorMessage.includes('Invalid token type');

                    if (shouldNotRefresh) {
                        // Invalid credentials or other non-refreshable error, clear and redirect
                        this.clearAuthData();
                        window.location.href = '/login';
                        return Promise.reject(error);
                    }

                    // For all other 401 errors (expired token, expired session, revoked token, etc.)
                    // try to refresh the token
                    if (this.isRefreshing) {
                        // If already refreshing, queue this request
                        return new Promise((resolve, reject) => {
                            this.failedQueue.push({ resolve, reject });
                        })
                            .then(() => {
                                return this.api(originalRequest);
                            })
                            .catch((err) => {
                                return Promise.reject(err);
                            });
                    }

                    originalRequest._retry = true;
                    this.isRefreshing = true;

                    try {
                        // Attempt to refresh the token
                        const refreshToken = localStorage.getItem('refreshToken');

                        if (!refreshToken) {
                            // No refresh token available, clear auth and redirect
                            console.log('Session expired, redirecting to login...');
                            this.clearAuthData();
                            // Use setTimeout to allow the current call stack to complete
                            setTimeout(() => {
                                window.location.href = '/login';
                            }, 100);
                            // Return a promise that never resolves to prevent further processing
                            return new Promise(() => { });
                        }

                        // Call refresh endpoint
                        const response = await axios.post<ApiResponse<{ token: string; sessionToken: string }>>(
                            'https://localhost:3000/api/auth/refresh',
                            { refreshToken },
                            { withCredentials: true }
                        );

                        if (response.data.success && response.data.data) {
                            const { token, sessionToken } = response.data.data;

                            // Store new tokens
                            localStorage.setItem('token', token);
                            if (sessionToken) {
                                localStorage.setItem('sessionToken', sessionToken);
                            }

                            // Store token expiry time (1 hour from now)
                            const expiryTime = Date.now() + (60 * 60 * 1000); // 1 hour
                            localStorage.setItem('tokenExpiry', expiryTime.toString());

                            // Process queued requests
                            this.processQueue(null);

                            // Retry original request
                            return this.api(originalRequest);
                        } else {
                            throw new Error('Token refresh failed');
                        }
                    } catch (refreshError) {
                        // Refresh failed, clear tokens and redirect to login
                        this.processQueue(refreshError);
                        this.clearAuthData();
                        window.location.href = '/login';
                        return Promise.reject(refreshError);
                    } finally {
                        this.isRefreshing = false;
                    }
                }

                return Promise.reject(error);
            }
        );
    }

    private processQueue(error: any) {
        this.failedQueue.forEach((promise) => {
            if (error) {
                promise.reject(error);
            } else {
                promise.resolve();
            }
        });

        this.failedQueue = [];
    }

    private clearAuthData() {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('sessionToken');
        localStorage.removeItem('tokenExpiry');
        localStorage.removeItem('user');
    }

    // Check if token is expired or about to expire (within 5 minutes)
    isTokenExpired(): boolean {
        const expiryTime = localStorage.getItem('tokenExpiry');
        if (!expiryTime) return true;

        const expiry = parseInt(expiryTime, 10);
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;

        return now >= (expiry - fiveMinutes);
    }

    async get<T>(url: string): Promise<ApiResponse<T>> {
        const response = await this.api.get<ApiResponse<T>>(url);
        return response.data;
    }

    async post<T>(url: string, data?: any): Promise<ApiResponse<T>> {
        const response = await this.api.post<ApiResponse<T>>(url, data);
        return response.data;
    }

    async put<T>(url: string, data?: any): Promise<ApiResponse<T>> {
        const response = await this.api.put<ApiResponse<T>>(url, data);
        return response.data;
    }

    async delete<T>(url: string): Promise<ApiResponse<T>> {
        const response = await this.api.delete<ApiResponse<T>>(url);
        return response.data;
    }

    async patch<T>(url: string, data?: any): Promise<ApiResponse<T>> {
        const response = await this.api.patch<ApiResponse<T>>(url, data);
        return response.data;
    }
}

export const apiService = new ApiService();
export default apiService;
