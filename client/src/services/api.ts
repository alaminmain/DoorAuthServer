import axios, { type AxiosInstance, type AxiosError } from 'axios';
import type { ApiResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:3000/api';

class ApiService {
    private api: AxiosInstance;

    constructor() {
        this.api = axios.create({
            baseURL: API_BASE_URL,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Request interceptor to add auth token
        this.api.interceptors.request.use(
            (config) => {
                const token = localStorage.getItem('token');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Response interceptor for error handling
        this.api.interceptors.response.use(
            (response) => response,
            (error: AxiosError<ApiResponse>) => {
                if (error.response?.status === 401) {
                    // Unauthorized - clear token and redirect to login
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                }
                return Promise.reject(error);
            }
        );
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
