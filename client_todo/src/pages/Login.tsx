import { useAuth } from '../auth/AuthProvider';
import { LogIn } from 'lucide-react';

export default function Login() {
    const { login } = useAuth();

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Todo App</h1>
                <p className="text-gray-500 mb-8">Please sign in to manage your tasks</p>

                <button
                    onClick={login}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                    <LogIn size={20} />
                    Login with DoorAuth
                </button>
            </div>
        </div>
    );
}
