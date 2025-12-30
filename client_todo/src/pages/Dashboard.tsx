import { useState, useEffect } from 'react';
import { TodoService } from '../services/TodoService';
import { useAuth } from '../auth/AuthProvider';
import { LogOut, Plus, Trash2, CheckCircle, Circle } from 'lucide-react';

export default function Dashboard() {
    const { user, logout } = useAuth();
    const [todos, setTodos] = useState<any[]>([]);
    const [newTodo, setNewTodo] = useState('');

    useEffect(() => {
        loadTodos();
    }, []);

    const loadTodos = async () => {
        const data = await TodoService.getTodos();
        setTodos(data);
    };

    const addTodo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTodo.trim()) return;
        await TodoService.addTodo(newTodo);
        setNewTodo('');
        await loadTodos();
    };

    const toggleTodo = async (id: string) => {
        await TodoService.toggleTodo(id);
        await loadTodos();
    };

    const deleteTodo = async (id: string) => {
        await TodoService.deleteTodo(id);
        await loadTodos();
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow">
                <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
                    <h1 className="text-xl font-bold text-gray-800">Todo App</h1>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <div className="font-medium text-gray-900">{user?.email}</div>
                            <div className="text-xs text-gray-500">ID: {user?.userId}</div>
                            <div className="text-xs text-gray-400">Tenant: {user?.tenantId}</div>
                        </div>
                        <a
                            href="https://localhost:7140"
                            className="px-3 py-2 text-sm text-gray-600 hover:text-blue-600 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                            title="Back to Portal"
                        >
                            ← Portal
                        </a>
                        <button
                            onClick={logout}
                            className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-gray-100 transition-colors"
                            title="Logout from DoorAuth (all apps)"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-2xl mx-auto px-4 py-8">
                {/* Add Todo */}
                <form onSubmit={addTodo} className="mb-8">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newTodo}
                            onChange={(e) => setNewTodo(e.target.value)}
                            placeholder="Add a new task..."
                            className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                        />
                        <button
                            type="submit"
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
                        >
                            <Plus size={20} />
                            Add
                        </button>
                    </div>
                </form>

                {/* Todo List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {todos.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            No tasks yet. Add one above!
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {todos.map(todo => (
                                <div key={todo.id} className="p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors group">
                                    <button
                                        onClick={() => toggleTodo(todo.id)}
                                        className={`text-gray-400 hover:text-blue-600 transition-colors ${todo.completed ? 'text-green-500 hover:text-green-600' : ''}`}
                                    >
                                        {todo.completed ? <CheckCircle size={24} /> : <Circle size={24} />}
                                    </button>
                                    <span className={`flex-1 text-lg ${todo.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                                        {todo.text}
                                    </span>
                                    <button
                                        onClick={() => deleteTodo(todo.id)}
                                        className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-2"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
