import axios from 'axios';
import { AuthService } from './AuthService';

const API_URL = 'http://localhost:3000/api';

const api = axios.create({
    baseURL: API_URL
});

api.interceptors.request.use(config => {
    const token = AuthService.getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export interface Todo {
    id: string;
    text: string;
    completed: boolean;
}

export const TodoService = {
    // These endpoints will need to be implemented on the backend if we want real data
    // For now, we can mock them or store them in localStorage on client side
    // BUT, the prompt asked to integrate with the DoorAuth system, implying secured access.

    async getTodos() {
        // Mock implementation for now as we don't have todo endpoints in backend yet
        const stored = localStorage.getItem('todos');
        return stored ? JSON.parse(stored) : [];
    },

    async addTodo(text: string) {
        const todos = await this.getTodos();
        const newTodo = { id: Date.now().toString(), text, completed: false };
        todos.push(newTodo);
        localStorage.setItem('todos', JSON.stringify(todos));
        return newTodo;
    },

    async toggleTodo(id: string) {
        const todos = await this.getTodos();
        const index = todos.findIndex((t: Todo) => t.id === id);
        if (index !== -1) {
            todos[index].completed = !todos[index].completed;
            localStorage.setItem('todos', JSON.stringify(todos));
            return todos[index];
        }
        return null;
    },

    async deleteTodo(id: string) {
        const todos = await this.getTodos();
        const filtered = todos.filter((t: Todo) => t.id !== id);
        localStorage.setItem('todos', JSON.stringify(filtered));
    }
};
